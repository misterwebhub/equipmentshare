const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const BOOKING_SELECT = `SELECT b.*,c.name as customer_name,c.email as customer_email,c.phone as customer_phone,
  u.name as assigned_user_name
  FROM bookings b
  JOIN customers c ON b.customer_id=c.id
  LEFT JOIN users u ON b.assigned_user_id=u.id`;

/* Fetch items for a booking */
async function fetchItems(bookingId) {
  const [items] = await pool.execute(
    `SELECT bi.*, e.name as equipment_name, e.category_id,
       eu.sku_code as unit_sku_code
     FROM booking_items bi
     JOIN equipment e ON bi.equipment_id=e.id
     LEFT JOIN equipment_units eu ON bi.equipment_unit_id=eu.id
     WHERE bi.booking_id=?
     ORDER BY bi.sort_order, bi.created_at`,
    [bookingId]
  );
  return items;
}

/* Helper: update SKU/equipment statuses for all items in a booking */
async function syncUnitStatuses(bookingId, newStatus) {
  const unitStatus =
    newStatus === 'active'    ? 'rented-out' :
    newStatus === 'completed' ? 'available'  :
    newStatus === 'cancelled' ? 'available'  : null;

  if (!unitStatus) return;

  const [items] = await pool.execute(
    'SELECT equipment_id, equipment_unit_id FROM booking_items WHERE booking_id=?',
    [bookingId]
  );
  for (const item of items) {
    if (item.equipment_unit_id) {
      await pool.execute('UPDATE equipment_units SET status=? WHERE id=?', [unitStatus, item.equipment_unit_id]);
    } else {
      await pool.execute('UPDATE equipment SET status=? WHERE id=?', [unitStatus, item.equipment_id]);
    }
  }
}

/* Auto-increment invoice number: INV-00001 */
async function nextInvoiceNumber(orgId) {
  const [[row]] = await pool.execute(
    `SELECT invoice_number FROM bookings WHERE org_id=? AND invoice_number IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
    [orgId]
  );
  if (!row) return 'INV-00001';
  const num = parseInt((row.invoice_number || '').replace(/\D/g, '')) || 0;
  return `INV-${String(num + 1).padStart(5, '0')}`;
}

/* ── LIST ─────────────────────────────────────────────────────────── */
async function list(req, res) {
  try {
    const { search, status, from, to, page = 1, limit = 50 } = req.query;
    let sql = `${BOOKING_SELECT}
      LEFT JOIN booking_items bi_first ON bi_first.booking_id=b.id AND bi_first.sort_order=(
        SELECT MIN(sort_order) FROM booking_items WHERE booking_id=b.id
      )
      LEFT JOIN equipment e_first ON bi_first.equipment_id=e_first.id
      WHERE b.org_id=?`;
    const params = [req.orgId];

    if (status) { sql += ' AND b.status=?'; params.push(status); }
    if (from)   { sql += ' AND b.start_date>=?'; params.push(from); }
    if (to)     { sql += ' AND b.end_date<=?'; params.push(to); }
    if (search) {
      sql += ' AND (c.name LIKE ? OR b.invoice_number LIKE ? OR e_first.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' GROUP BY b.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [rows] = await pool.execute(sql, params);

    // Attach item count + first equipment name to each booking
    const bookingIds = rows.map(r => r.id);
    let itemSummaries = [];
    if (bookingIds.length) {
      const placeholders = bookingIds.map(() => '?').join(',');
      const [summaries] = await pool.execute(
        `SELECT bi.booking_id, COUNT(*) as item_count,
           GROUP_CONCAT(e.name ORDER BY bi.sort_order SEPARATOR ', ') as equipment_names
         FROM booking_items bi JOIN equipment e ON bi.equipment_id=e.id
         WHERE bi.booking_id IN (${placeholders})
         GROUP BY bi.booking_id`,
        bookingIds
      );
      itemSummaries = summaries;
    }
    const summaryMap = Object.fromEntries(itemSummaries.map(s => [s.booking_id, s]));
    const enriched = rows.map(r => ({
      ...r,
      item_count: summaryMap[r.id]?.item_count || 0,
      equipment_names: summaryMap[r.id]?.equipment_names || '',
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* ── GET BY ID ────────────────────────────────────────────────────── */
async function getById(req, res) {
  try {
    const [rows] = await pool.execute(
      `${BOOKING_SELECT} WHERE b.id=? AND b.org_id=?`,
      [req.params.id, req.orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const [penalties] = await pool.execute('SELECT * FROM penalties WHERE booking_id=?', [req.params.id]);
    const items = await fetchItems(req.params.id);
    res.json({ success: true, data: { ...rows[0], penalties, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* ── CREATE ───────────────────────────────────────────────────────── */
async function create(req, res) {
  try {
    const {
      customer_id, assigned_user_id, start_date, end_date,
      security_deposit, notes, status,
      discount, tax_rate, is_quotation, quotation_expires_at,
      items, // [{ equipment_id, equipment_unit_id?, description?, pricing_type, unit_rate, quantity }]
    } = req.body;

    if (!customer_id || !start_date || !end_date)
      return res.status(400).json({ success: false, message: 'customer_id, start_date, end_date required' });
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ success: false, message: 'At least one item required' });

    // Validate + check SKU availability per item
    for (const item of items) {
      if (!item.equipment_id) return res.status(400).json({ success: false, message: 'Each item needs equipment_id' });
      if (item.equipment_unit_id) {
        const [conflicts] = await pool.execute(
          `SELECT id FROM booking_items bi JOIN bookings b ON bi.booking_id=b.id
           WHERE bi.equipment_unit_id=? AND b.org_id=? AND b.status NOT IN ('cancelled','completed')
             AND NOT (b.end_date < ? OR b.start_date > ?)`,
          [item.equipment_unit_id, req.orgId, start_date, end_date]
        );
        if (conflicts.length)
          return res.status(409).json({ success: false, message: `SKU unit for item is already booked on these dates` });
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.unit_rate) || 0) * (parseFloat(it.quantity) || 1), 0);
    const discountAmt = parseFloat(discount) || 0;
    const taxAmt = ((subtotal - discountAmt) * (parseFloat(tax_rate) || 0)) / 100;
    const estimatedCost = Math.max(0, subtotal - discountAmt + taxAmt);

    const invoiceNumber = await nextInvoiceNumber(req.orgId);
    const id = uuidv4();
    const primaryEquipmentId = items[0].equipment_id; // keep legacy col non-null

    await pool.execute(
      `INSERT INTO bookings (id,org_id,customer_id,equipment_id,assigned_user_id,start_date,end_date,
         estimated_cost,security_deposit,discount,tax_rate,notes,status,invoice_number,is_quotation,quotation_expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.orgId, customer_id, primaryEquipmentId, assigned_user_id || null,
        start_date, end_date, estimatedCost,
        parseFloat(security_deposit) || 0,
        discountAmt, parseFloat(tax_rate) || 0,
        notes || '', is_quotation ? 'pending' : (status || 'pending'), invoiceNumber,
        is_quotation ? 1 : 0, quotation_expires_at || null,
      ]
    );

    // Insert booking items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const lineTotal = (parseFloat(it.unit_rate) || 0) * (parseFloat(it.quantity) || 1);
      await pool.execute(
        `INSERT INTO booking_items (id,org_id,booking_id,equipment_id,equipment_unit_id,description,pricing_type,unit_rate,quantity,line_total,notes,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          uuidv4(), req.orgId, id,
          it.equipment_id, it.equipment_unit_id || null,
          it.description || '', it.pricing_type || 'daily',
          parseFloat(it.unit_rate) || 0, parseFloat(it.quantity) || 1,
          lineTotal, it.notes || '', i,
        ]
      );
    }

    // Update unit statuses if booking goes straight to active
    if (status === 'active') await syncUnitStatuses(id, 'active');

    const [rows] = await pool.execute(`${BOOKING_SELECT} WHERE b.id=?`, [id]);
    const itemsResult = await fetchItems(id);
    res.status(201).json({ success: true, data: { ...rows[0], items: itemsResult } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* ── UPDATE STATUS ────────────────────────────────────────────────── */
async function updateStatus(req, res) {
  try {
    const { status, actual_cost } = req.body;
    await pool.execute(
      'UPDATE bookings SET status=?,actual_cost=COALESCE(?,actual_cost) WHERE id=? AND org_id=?',
      [status, actual_cost || null, req.params.id, req.orgId]
    );
    await syncUnitStatuses(req.params.id, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* ── CONVERT QUOTATION TO BOOKING ────────────────────────────────── */
async function convertQuotation(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (!rows[0].is_quotation) return res.status(400).json({ success: false, message: 'Not a quotation' });
    await pool.execute(
      'UPDATE bookings SET is_quotation=0, status="pending" WHERE id=? AND org_id=?',
      [req.params.id, req.orgId]
    );
    res.json({ success: true, message: 'Converted to booking' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

/* ── CHECK AVAILABILITY (legacy) ─────────────────────────────────── */
async function checkAvailability(req, res) {
  try {
    const { equipment_id, start_date, end_date, exclude_booking_id } = req.query;
    let sql = `SELECT b.id FROM booking_items bi JOIN bookings b ON bi.booking_id=b.id
               WHERE bi.equipment_id=? AND b.org_id=? AND b.status NOT IN ('cancelled','completed')
               AND NOT (b.end_date < ? OR b.start_date > ?)`;
    const params = [equipment_id, req.orgId, start_date, end_date];
    if (exclude_booking_id) { sql += ' AND b.id != ?'; params.push(exclude_booking_id); }
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, available: rows.length === 0, conflicts: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, checkAvailability, getById, create, updateStatus, convertQuotation };
