const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function getProfile(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM organisations WHERE id=?', [req.orgId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, category, phone, address, tax_number, currency } = req.body;
    await pool.execute(
      'UPDATE organisations SET name=?,category=?,phone=?,address=?,tax_number=?,currency=? WHERE id=?',
      [name, category || 'construction', phone || '', address || '', tax_number || '', currency || 'USD', req.orgId]
    );
    const [rows] = await pool.execute('SELECT * FROM organisations WHERE id=?', [req.orgId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.execute('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getBilling(req, res) {
  try {
    const [sub] = await pool.execute(
      `SELECT s.*, p.name as plan_name, p.price_monthly, p.price_yearly, p.max_equipment, p.max_users, p.features
       FROM subscriptions s JOIN plans p ON s.plan_id=p.id
       WHERE s.org_id=? AND s.status IN ('active','trial') ORDER BY s.created_at DESC LIMIT 1`,
      [req.orgId]
    );
    const [[equipCount]] = await pool.execute(
      'SELECT COUNT(*) as count FROM equipment WHERE org_id=? AND deleted_at IS NULL', [req.orgId]
    );
    const [[userCount]] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE org_id=? AND status="active"', [req.orgId]
    );
    const [orgRows] = await pool.execute(
      'SELECT id, name, email, status, trial_ends_at, plan_id FROM organisations WHERE id=?', [req.orgId]
    );
    res.json({
      success: true,
      data: {
        organisation: orgRows[0] || null,
        subscription: sub[0] || null,
        usage: { equipment: equipCount.count, users: userCount.count },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getProfile, updateProfile, changePassword, getBilling };
