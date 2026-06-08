const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { unread_only } = req.query;
    let sql = `SELECT * FROM notifications WHERE org_id=? AND (user_id=? OR user_id IS NULL)`;
    const params = [req.orgId, req.user.id];
    if (unread_only === '1') { sql += ' AND is_read=0'; }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await pool.execute(sql, params);
    const [[{ unread }]] = await pool.execute(
      `SELECT COUNT(*) as unread FROM notifications WHERE org_id=? AND (user_id=? OR user_id IS NULL) AND is_read=0`,
      [req.orgId, req.user.id]
    );
    res.json({ success: true, data: rows, unread_count: unread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markRead(req, res) {
  try {
    const { ids } = req.body; // array of ids, or empty = mark all
    if (Array.isArray(ids) && ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      await pool.execute(`UPDATE notifications SET is_read=1 WHERE id IN (${placeholders}) AND org_id=?`, [...ids, req.orgId]);
    } else {
      await pool.execute(`UPDATE notifications SET is_read=1 WHERE org_id=? AND (user_id=? OR user_id IS NULL)`, [req.orgId, req.user.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function create(req, res) {
  try {
    const { type, title, message, user_id } = req.body;
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO notifications (id,org_id,user_id,type,title,message) VALUES (?,?,?,?,?,?)',
      [id, req.orgId, user_id || null, type || 'info', title, message || '']
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function remove(req, res) {
  try {
    await pool.execute('DELETE FROM notifications WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { list, markRead, create, remove };
