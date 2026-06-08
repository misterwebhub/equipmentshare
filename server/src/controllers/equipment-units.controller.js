const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

/* GET /equipment/:id/units  — list all SKU units for an equipment model */
async function listUnits(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.*,
         (SELECT b.id FROM bookings b WHERE b.equipment_unit_id=u.id AND b.status IN ('active','overdue') LIMIT 1) as active_booking_id,
         (SELECT CONCAT(c.name,' → ',b.start_date,' – ',b.end_date)
          FROM bookings b JOIN customers c ON b.customer_id=c.id
          WHERE b.equipment_unit_id=u.id AND b.status IN ('active','overdue') LIMIT 1) as active_booking_info
       FROM equipment_units u
       WHERE u.equipment_id=? AND u.org_id=?
       ORDER BY u.sku_code`,
      [req.params.id, req.orgId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* GET /equipment-units/available?equipment_id=&start_date=&end_date= */
async function availableUnits(req, res) {
  try {
    const { equipment_id, start_date, end_date, exclude_booking_id } = req.query;
    if (!equipment_id || !start_date || !end_date)
      return res.status(400).json({ success: false, message: 'equipment_id, start_date, end_date required' });

    // Units of this equipment that have NO overlapping active booking in the date range
    let sql = `
      SELECT u.* FROM equipment_units u
      WHERE u.equipment_id = ? AND u.org_id = ?
        AND u.status NOT IN ('retired','damaged')
        AND u.id NOT IN (
          SELECT b.equipment_unit_id FROM bookings b
          WHERE b.equipment_unit_id IS NOT NULL
            AND b.org_id = ?
            AND b.status NOT IN ('cancelled','completed')
            AND NOT (b.end_date < ? OR b.start_date > ?)
            ${exclude_booking_id ? 'AND b.id != ?' : ''}
        )
      ORDER BY u.sku_code`;

    const params = [equipment_id, req.orgId, req.orgId, start_date, end_date];
    if (exclude_booking_id) params.push(exclude_booking_id);

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows, available_count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* POST /equipment/:id/units  — bulk-create SKU units */
async function createUnits(req, res) {
  try {
    const { skus } = req.body; // [{ sku_code, notes? }, ...]
    if (!Array.isArray(skus) || !skus.length)
      return res.status(400).json({ success: false, message: 'skus array required' });

    const created = [];
    const errors = [];

    for (const sku of skus) {
      if (!sku.sku_code?.trim()) { errors.push(`Empty SKU skipped`); continue; }
      try {
        const id = uuidv4();
        await pool.execute(
          'INSERT INTO equipment_units (id,org_id,equipment_id,sku_code,notes) VALUES (?,?,?,?,?)',
          [id, req.orgId, req.params.id, sku.sku_code.trim().toUpperCase(), sku.notes || '']
        );
        created.push({ id, sku_code: sku.sku_code.trim().toUpperCase() });
      } catch (e) {
        errors.push(`SKU ${sku.sku_code}: ${e.message}`);
      }
    }

    // Update equipment total count
    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM equipment_units WHERE equipment_id=? AND org_id=?',
      [req.params.id, req.orgId]
    );

    res.status(201).json({ success: true, created, errors, total_units: cnt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* PUT /equipment-units/:unitId  — update a single SKU */
async function updateUnit(req, res) {
  try {
    const { sku_code, status, notes } = req.body;
    await pool.execute(
      'UPDATE equipment_units SET sku_code=?, status=?, notes=? WHERE id=? AND org_id=?',
      [sku_code.trim().toUpperCase(), status, notes || '', req.params.unitId, req.orgId]
    );
    const [rows] = await pool.execute('SELECT * FROM equipment_units WHERE id=?', [req.params.unitId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* DELETE /equipment-units/:unitId */
async function deleteUnit(req, res) {
  try {
    // Block delete if unit has active booking
    const [[active]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM bookings WHERE equipment_unit_id=? AND status IN ('active','overdue','pending')`,
      [req.params.unitId]
    );
    if (active.cnt > 0)
      return res.status(409).json({ success: false, message: 'Cannot delete unit with active bookings' });

    await pool.execute('DELETE FROM equipment_units WHERE id=? AND org_id=?', [req.params.unitId, req.orgId]);
    res.json({ success: true, message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/* GET /equipment-units/fleet — full fleet view: all units across all equipment */
async function fleetView(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.*,
         e.name as equipment_name, e.category_id,
         c.name as category_name, c.color as category_color,
         b.id as booking_id, b.status as booking_status,
         b.start_date, b.end_date,
         cust.name as customer_name
       FROM equipment_units u
       JOIN equipment e ON u.equipment_id = e.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN bookings b ON b.equipment_unit_id = u.id AND b.status IN ('active','overdue','pending')
       LEFT JOIN customers cust ON b.customer_id = cust.id
       WHERE u.org_id = ?
       ORDER BY e.name, u.sku_code`,
      [req.orgId]
    );

    // Summary counts
    const [[summary]] = await pool.execute(
      `SELECT
         COUNT(*) as total,
         COALESCE(SUM(status='available'),0) as available,
         COALESCE(SUM(status='rented-out'),0) as rented_out,
         COALESCE(SUM(status='maintenance'),0) as maintenance,
         COALESCE(SUM(status='damaged'),0) as damaged,
         COALESCE(SUM(status='retired'),0) as retired
       FROM equipment_units WHERE org_id=?`,
      [req.orgId]
    );

    res.json({ success: true, data: rows, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listUnits, availableUnits, createUnits, updateUnit, deleteUnit, fleetView };
