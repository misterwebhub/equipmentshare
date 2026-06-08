const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { status, priority, category } = req.query;
    let sql = `SELECT st.*, u.name as created_by_name, a.name as assigned_to_name
               FROM support_tickets st
               LEFT JOIN users u ON st.created_by=u.id
               LEFT JOIN users a ON st.assigned_to=a.id
               WHERE st.org_id=?`;
    const params = [req.orgId];
    if (status)   { sql += ' AND st.status=?';   params.push(status); }
    if (priority) { sql += ' AND st.priority=?'; params.push(priority); }
    if (category) { sql += ' AND st.category=?'; params.push(category); }
    sql += ' ORDER BY st.created_at DESC LIMIT 200';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT st.*, u.name as created_by_name, a.name as assigned_to_name
       FROM support_tickets st
       LEFT JOIN users u ON st.created_by=u.id
       LEFT JOIN users a ON st.assigned_to=a.id
       WHERE st.id=? AND st.org_id=?`,
      [req.params.id, req.orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const [comments] = await pool.execute(
      `SELECT tc.*, u.name as author_name FROM ticket_comments tc
       LEFT JOIN users u ON tc.user_id=u.id
       WHERE tc.ticket_id=? ORDER BY tc.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], comments } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function create(req, res) {
  try {
    const { title, description, category, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title required' });
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO support_tickets (id,org_id,created_by,title,description,category,priority)
       VALUES (?,?,?,?,?,?,?)`,
      [id, req.orgId, req.user.id, title, description||'', category||'other', priority||'medium']
    );
    const [rows] = await pool.execute('SELECT * FROM support_tickets WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateStatus(req, res) {
  try {
    const { status, assigned_to, priority } = req.body;
    const resolved_at = status === 'resolved' || status === 'closed'
      ? new Date().toISOString().slice(0,19).replace('T',' ') : null;
    await pool.execute(
      `UPDATE support_tickets SET
         status=COALESCE(?,status),
         assigned_to=COALESCE(?,assigned_to),
         priority=COALESCE(?,priority),
         resolved_at=COALESCE(?,resolved_at)
       WHERE id=? AND org_id=?`,
      [status||null, assigned_to||null, priority||null, resolved_at, req.params.id, req.orgId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function addComment(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO ticket_comments (id,ticket_id,user_id,message) VALUES (?,?,?,?)',
      [id, req.params.id, req.user.id, message]
    );
    const [rows] = await pool.execute(
      `SELECT tc.*, u.name as author_name FROM ticket_comments tc
       LEFT JOIN users u ON tc.user_id=u.id WHERE tc.id=?`, [id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function stats(req, res) {
  try {
    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) as total,
         COALESCE(SUM(status='open'),0) as open_count,
         COALESCE(SUM(status='in_progress'),0) as in_progress,
         COALESCE(SUM(status='resolved'),0) as resolved,
         COALESCE(SUM(priority='urgent'),0) as urgent,
         COALESCE(SUM(priority='high'),0) as high
       FROM support_tickets WHERE org_id=?`,
      [req.orgId]
    );
    res.json({ success: true, data: summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { list, getById, create, updateStatus, addComment, stats };
