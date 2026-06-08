const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { search, role, status } = req.query;
    let sql = 'SELECT id,org_id,name,email,role,status,last_login,created_at FROM users WHERE org_id=? AND role != "superadmin"';
    const params = [req.orgId];
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role) { sql += ' AND role=?'; params.push(role); }
    if (status) { sql += ' AND status=?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function invite(req, res) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email required' });
    const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists' });
    const tempPassword = 'Temp@' + Math.random().toString(36).slice(-6) + '1';
    const hash = await bcrypt.hash(tempPassword, 10);
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO users (id,org_id,name,email,password_hash,role,status,invited_by) VALUES (?,?,?,?,?,?,?,?)',
      [id, req.orgId, name, email, hash, role || 'operator', 'active', req.user.id]
    );
    const [rows] = await pool.execute('SELECT id,name,email,role,status FROM users WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0], temp_password: tempPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, role } = req.body;
    await pool.execute('UPDATE users SET name=?,role=? WHERE id=? AND org_id=?', [name, role, req.params.id, req.orgId]);
    const [rows] = await pool.execute('SELECT id,name,email,role,status FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deactivate(req, res) {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    await pool.execute('UPDATE users SET status="inactive" WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, invite, update, deactivate };
