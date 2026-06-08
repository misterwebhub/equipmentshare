const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { search, status, category_id, page = 1, limit = 50 } = req.query;
    let sql = `SELECT e.*, c.name as category_name, c.color as category_color, u.name as assigned_user_name,
               (SELECT COUNT(*) FROM equipment_units eu WHERE eu.equipment_id=e.id) as total_units,
               (SELECT COUNT(*) FROM equipment_units eu WHERE eu.equipment_id=e.id AND eu.status='available') as available_units,
               (SELECT COUNT(*) FROM equipment_units eu WHERE eu.equipment_id=e.id AND eu.status='rented-out') as rented_units,
               (SELECT COUNT(*) FROM equipment_units eu WHERE eu.equipment_id=e.id AND eu.status='maintenance') as maintenance_units
               FROM equipment e
               LEFT JOIN categories c ON e.category_id = c.id
               LEFT JOIN users u ON e.assigned_user_id = u.id
               WHERE e.org_id = ? AND e.deleted_at IS NULL`;
    const params = [req.orgId];

    if (search) {
      sql += ' AND (e.name LIKE ? OR e.description LIKE ? OR e.serial_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { sql += ' AND e.status = ?'; params.push(status); }
    if (category_id) { sql += ' AND e.category_id = ?'; params.push(category_id); }
    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [rows] = await pool.execute(sql, params);
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM equipment WHERE org_id=? AND deleted_at IS NULL',
      [req.orgId]
    );
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, c.name as category_name FROM equipment e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id=? AND e.org_id=? AND e.deleted_at IS NULL`,
      [req.params.id, req.orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const {
      name, description, category_id, serial_number, location, condition,
      pricing_type, fixed_rate, billing_period, hourly_rate,
      min_rental_days, security_deposit, certifications, specifications,
      skus, // array of { sku_code, notes? }
    } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO equipment (id,org_id,category_id,name,description,serial_number,location,\`condition\`,pricing_type,fixed_rate,billing_period,hourly_rate,min_rental_days,security_deposit,certifications,specifications)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.orgId, category_id || null, name, description || '',
        serial_number || '', location || '', condition || 'good',
        pricing_type || 'fixed', fixed_rate || 0, billing_period || 'daily',
        hourly_rate || null, min_rental_days || 1, security_deposit || 0,
        JSON.stringify(certifications || []), JSON.stringify(specifications || {}),
      ]
    );

    // Create SKU units if provided
    const skuErrors = [];
    if (Array.isArray(skus) && skus.length) {
      for (const sku of skus) {
        if (!sku.sku_code?.trim()) continue;
        try {
          await pool.execute(
            'INSERT INTO equipment_units (id,org_id,equipment_id,sku_code,notes) VALUES (?,?,?,?,?)',
            [uuidv4(), req.orgId, id, sku.sku_code.trim().toUpperCase(), sku.notes || '']
          );
        } catch (e) {
          skuErrors.push(`SKU ${sku.sku_code}: ${e.message}`);
        }
      }
    }

    const [rows] = await pool.execute(
      `SELECT e.*, c.name as category_name,
         (SELECT COUNT(*) FROM equipment_units eu WHERE eu.equipment_id=e.id) as total_units
       FROM equipment e LEFT JOIN categories c ON e.category_id=c.id WHERE e.id=?`,
      [id]
    );
    res.status(201).json({ success: true, data: rows[0], sku_errors: skuErrors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const {
      name, description, category_id, serial_number, location, condition, status,
      pricing_type, fixed_rate, billing_period, hourly_rate,
      min_rental_days, security_deposit, certifications, specifications,
    } = req.body;
    await pool.execute(
      `UPDATE equipment SET name=?,description=?,category_id=?,serial_number=?,location=?,\`condition\`=?,status=?,
       pricing_type=?,fixed_rate=?,billing_period=?,hourly_rate=?,min_rental_days=?,security_deposit=?,
       certifications=?,specifications=? WHERE id=? AND org_id=?`,
      [
        name, description || '', category_id || null, serial_number || '',
        location || '', condition || 'good', status || 'available',
        pricing_type || 'fixed', fixed_rate || 0, billing_period || 'daily',
        hourly_rate || null, min_rental_days || 1, security_deposit || 0,
        JSON.stringify(certifications || []), JSON.stringify(specifications || {}),
        req.params.id, req.orgId,
      ]
    );
    const [rows] = await pool.execute(
      'SELECT e.*, c.name as category_name FROM equipment e LEFT JOIN categories c ON e.category_id=c.id WHERE e.id=?',
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await pool.execute('UPDATE equipment SET deleted_at=NOW() WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    await pool.execute('UPDATE equipment SET status=? WHERE id=? AND org_id=?', [req.body.status, req.params.id, req.orgId]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, c.name as customer_name FROM bookings b
       JOIN customers c ON b.customer_id=c.id
       WHERE b.equipment_id=? AND b.org_id=? ORDER BY b.created_at DESC`,
      [req.params.id, req.orgId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, getById, create, update, remove, updateStatus, getHistory };
