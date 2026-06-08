const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(e.id) as equipment_count
       FROM categories c LEFT JOIN equipment e ON c.id=e.category_id AND e.deleted_at IS NULL
       WHERE c.org_id=? GROUP BY c.id ORDER BY c.name`,
      [req.orgId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, parent_id, icon, color, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO categories (id,org_id,name,parent_id,icon,color,description) VALUES (?,?,?,?,?,?,?)',
      [id, req.orgId, name, parent_id || null, icon || 'Package', color || '#3b82f6', description || '']
    );
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, icon, color, description } = req.body;
    await pool.execute(
      'UPDATE categories SET name=?,icon=?,color=?,description=? WHERE id=? AND org_id=?',
      [name, icon || 'Package', color || '#3b82f6', description || '', req.params.id, req.orgId]
    );
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await pool.execute('DELETE FROM categories WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, create, update, remove };
