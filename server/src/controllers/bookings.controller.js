const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const BOOKING_SELECT = `SELECT b.*,c.name as customer_name,e.name as equipment_name,u.name as assigned_user_name,
  eu.sku_code as equipment_sku_code
  FROM bookings b
  JOIN customers c ON b.customer_id=c.id
  JOIN equipment e ON b.equipment_id=e.id
  LEFT JOIN users u ON b.assigned_user_id=u.id
  LEFT JOIN equipment_units eu ON b.equipment_unit_id=eu.id`;

async function list(req, res) {
  try {
    const { search, status, from, to, page = 1, limit = 50 } = req.query;
    let sql = `${BOOKING_SELECT} WHERE b.org_id=?`;
    const params = [req.orgId];

    if (status) { sql += ' AND b.status=?'; params.push(status); }
    if (from) { sql += ' AND b.start_date>=?'; params.push(from); }
    if (to) { sql += ' AND b.end_date<=?'; params.push(to); }
    if (search) { sql += ' AND (c.name LIKE ? OR e.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function checkAvailability(req, res) {
  try {
    const { equipment_id, start_date, end_date, exclude_booking_id } = req.query;
    let sql = `SELECT id FROM bookings WHERE equipment_id=? AND org_id=? AND status NOT IN ('cancelled','completed') AND NOT (end_date < ? OR start_date > ?)`;
    const params = [equipment_id, req.orgId, start_date, end_date];
    if (exclude_booking_id) { sql += ' AND id != ?'; params.push(exclude_booking_id); }
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, available: rows.length === 0, conflicts: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*,c.name as customer_name,c.email as customer_email,c.phone as customer_phone,
       e.name as equipment_name,u.name as assigned_user_name
       FROM bookings b
       JOIN customers c ON b.customer_id=c.id
       JOIN equipment e ON b.equipment_id=e.id
       LEFT JOIN users u ON b.assigned_user_id=u.id
       WHERE b.id=? AND b.org_id=?`,
      [req.params.id, req.orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const [penalties] = await pool.execute('SELECT * FROM penalties WHERE booking_id=?', [req.params.id]);
    res.json({ success: true, data: { ...rows[0], penalties } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const {
      customer_id, equipment_id, equipment_unit_id, assigned_user_id, start_date, end_date,
      pricing_type, fixed_rate, hourly_rate, hours_used,
      estimated_cost, security_deposit, notes, status,
    } = req.body;
    if (!customer_id || !equipment_id || !start_date || !end_date)
      return res.status(400).json({ success: false, message: 'customer_id, equipment_id, start_date, end_date required' });

    // If a specific SKU unit is chosen, check SKU-level availability
    if (equipment_unit_id) {
      const [unitConflicts] = await pool.execute(
        `SELECT id FROM bookings WHERE equipment_unit_id=? AND org_id=? AND status NOT IN ('cancelled','completed') AND NOT (end_date < ? OR start_date > ?)`,
        [equipment_unit_id, req.orgId, start_date, end_date]
      );
      if (unitConflicts.length)
        return res.status(409).json({ success: false, message: 'This SKU unit is not available for selected dates' });
    } else {
      // Fall back to equipment-level conflict check (no SKU tracking)
      const [conflicts] = await pool.execute(
        `SELECT id FROM bookings WHERE equipment_id=? AND equipment_unit_id IS NULL AND org_id=? AND status NOT IN ('cancelled','completed') AND NOT (end_date < ? OR start_date > ?)`,
        [equipment_id, req.orgId, start_date, end_date]
      );
      if (conflicts.length)
        return res.status(409).json({ success: false, message: 'Equipment is not available for selected dates' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO bookings (id,org_id,customer_id,equipment_id,equipment_unit_id,assigned_user_id,start_date,end_date,pricing_type,fixed_rate,hourly_rate,hours_used,estimated_cost,security_deposit,notes,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.orgId, customer_id, equipment_id, equipment_unit_id || null, assigned_user_id || null,
        start_date, end_date, pricing_type || 'fixed', fixed_rate || 0,
        hourly_rate || null, hours_used || null, estimated_cost || 0,
        security_deposit || 0, notes || '', status || 'pending',
      ]
    );

    // Update unit status if SKU selected and booking is active
    if (equipment_unit_id && status === 'active')
      await pool.execute('UPDATE equipment_units SET status="rented-out" WHERE id=?', [equipment_unit_id]);
    else if (status === 'active')
      await pool.execute('UPDATE equipment SET status="rented-out" WHERE id=?', [equipment_id]);

    const [rows] = await pool.execute(`${BOOKING_SELECT} WHERE b.id=?`, [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const {
      customer_id, equipment_id, assigned_user_id, start_date, end_date,
      pricing_type, fixed_rate, hourly_rate, hours_used,
      estimated_cost, actual_cost, security_deposit, notes, status,
    } = req.body;
    await pool.execute(
      `UPDATE bookings SET customer_id=?,equipment_id=?,assigned_user_id=?,start_date=?,end_date=?,
       pricing_type=?,fixed_rate=?,hourly_rate=?,hours_used=?,estimated_cost=?,actual_cost=?,
       security_deposit=?,notes=?,status=? WHERE id=? AND org_id=?`,
      [
        customer_id, equipment_id, assigned_user_id || null, start_date, end_date,
        pricing_type || 'fixed', fixed_rate || 0, hourly_rate || null, hours_used || null,
        estimated_cost || 0, actual_cost || null, security_deposit || 0,
        notes || '', status || 'pending', req.params.id, req.orgId,
      ]
    );
    const [rows] = await pool.execute(`${BOOKING_SELECT} WHERE b.id=?`, [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status, actual_cost } = req.body;
    await pool.execute(
      'UPDATE bookings SET status=?,actual_cost=COALESCE(?,actual_cost) WHERE id=? AND org_id=?',
      [status, actual_cost || null, req.params.id, req.orgId]
    );
    const [booking] = await pool.execute('SELECT equipment_id, equipment_unit_id FROM bookings WHERE id=?', [req.params.id]);
    if (booking.length) {
      const { equipment_id, equipment_unit_id } = booking[0];
      const unitStatus =
        status === 'active' ? 'rented-out' :
        (status === 'completed' || status === 'cancelled') ? 'available' : null;

      if (unitStatus && equipment_unit_id) {
        await pool.execute('UPDATE equipment_units SET status=? WHERE id=?', [unitStatus, equipment_unit_id]);
      } else if (unitStatus) {
        await pool.execute('UPDATE equipment SET status=? WHERE id=?', [unitStatus, equipment_id]);
      }
    }
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, checkAvailability, getById, create, update, updateStatus };
