const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { resource_type, user_id, limit = 100 } = req.query;
    let sql = `SELECT al.*, u.name as user_name
               FROM activity_logs al
               LEFT JOIN users u ON al.user_id=u.id
               WHERE al.org_id=?`;
    const params = [req.orgId];
    if (resource_type) { sql += ' AND al.resource_type=?'; params.push(resource_type); }
    if (user_id)       { sql += ' AND al.user_id=?';       params.push(user_id); }
    sql += ` ORDER BY al.created_at DESC LIMIT ${Math.min(parseInt(limit)||100, 500)}`;
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function stats(req, res) {
  try {
    const [byUser] = await pool.execute(
      `SELECT u.name, COUNT(al.id) as actions
       FROM activity_logs al JOIN users u ON al.user_id=u.id
       WHERE al.org_id=? AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY al.user_id ORDER BY actions DESC LIMIT 10`,
      [req.orgId]
    );
    const [byAction] = await pool.execute(
      `SELECT action, COUNT(*) as count
       FROM activity_logs WHERE org_id=?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY action ORDER BY count DESC LIMIT 10`,
      [req.orgId]
    );
    res.json({ success: true, data: { by_user: byUser, by_action: byAction } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { list, stats };
