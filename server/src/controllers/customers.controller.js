const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    let sql = `SELECT c.*, COUNT(DISTINCT b.id) as total_bookings, COALESCE(SUM(b.actual_cost),0) as total_spent
               FROM customers c LEFT JOIN bookings b ON c.id=b.customer_id
               WHERE c.org_id=?`;
    const params = [req.orgId];
    if (search) { sql += ' AND c.name LIKE ?'; params.push(`%${search}%`); }
    if (status) { sql += ' AND c.status=?'; params.push(status); }
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
    const [bookings] = await pool.execute(
      `SELECT b.*,e.name as equipment_name FROM bookings b
       JOIN equipment e ON b.equipment_id=e.id
       WHERE b.customer_id=? ORDER BY b.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], recent_bookings: bookings } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, type, email, phone, address, tax_number, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO customers (id,org_id,name,type,email,phone,address,tax_number,notes) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, req.orgId, name, type || 'small_business', email || '', phone || '', address || '', tax_number || '', notes || '']
    );
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, type, email, phone, address, tax_number, notes, status } = req.body;
    await pool.execute(
      'UPDATE customers SET name=?,type=?,email=?,phone=?,address=?,tax_number=?,notes=?,status=? WHERE id=? AND org_id=?',
      [name, type || 'small_business', email || '', phone || '', address || '', tax_number || '', notes || '', status || 'active', req.params.id, req.orgId]
    );
    const [rows] = await pool.execute('SELECT * FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await pool.execute('UPDATE customers SET status="inactive" WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, getById, create, update, remove };
