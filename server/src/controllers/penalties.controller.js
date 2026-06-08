const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    let sql = `SELECT p.*, c.name as customer_name, e.name as equipment_name, b.start_date, b.end_date
               FROM penalties p
               JOIN bookings b ON p.booking_id=b.id
               JOIN customers c ON p.customer_id=c.id
               JOIN equipment e ON b.equipment_id=e.id
               WHERE p.org_id=?`;
    const params = [req.orgId];
    if (status) { sql += ' AND p.status=?'; params.push(status); }
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { booking_id, customer_id, type, amount, days_overdue, description } = req.body;
    if (!booking_id || !customer_id || !amount)
      return res.status(400).json({ success: false, message: 'booking_id, customer_id, amount required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO penalties (id,org_id,booking_id,customer_id,type,amount,days_overdue,description) VALUES (?,?,?,?,?,?,?,?)',
      [id, req.orgId, booking_id, customer_id, type || 'other', amount, days_overdue || 0, description || '']
    );
    const [rows] = await pool.execute('SELECT * FROM penalties WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function waive(req, res) {
  try {
    await pool.execute(
      'UPDATE penalties SET status="waived",waived_by=?,waive_reason=? WHERE id=? AND org_id=?',
      [req.user.id, req.body.reason || '', req.params.id, req.orgId]
    );
    res.json({ success: true, message: 'Penalty waived' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markPaid(req, res) {
  try {
    await pool.execute(
      'UPDATE penalties SET status="paid",paid_at=NOW() WHERE id=? AND org_id=?',
      [req.params.id, req.orgId]
    );
    res.json({ success: true, message: 'Penalty marked as paid' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, create, waive, markPaid };
