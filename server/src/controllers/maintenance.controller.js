const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { status } = req.query;
    let sql = `SELECT m.*, e.name as equipment_name, e.location as equipment_location
               FROM maintenance_schedules m JOIN equipment e ON m.equipment_id=e.id
               WHERE m.org_id=?`;
    const params = [req.orgId];
    if (status) { sql += ' AND m.status=?'; params.push(status); }
    sql += ' ORDER BY m.scheduled_date ASC';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const { equipment_id, type, frequency, scheduled_date, description, cost } = req.body;
    if (!equipment_id || !scheduled_date)
      return res.status(400).json({ success: false, message: 'equipment_id and scheduled_date required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO maintenance_schedules (id,org_id,equipment_id,type,frequency,scheduled_date,description,cost) VALUES (?,?,?,?,?,?,?,?)',
      [id, req.orgId, equipment_id, type || 'preventive', frequency || 'monthly', scheduled_date, description || '', cost || 0]
    );
    const [rows] = await pool.execute(
      'SELECT m.*, e.name as equipment_name FROM maintenance_schedules m JOIN equipment e ON m.equipment_id=e.id WHERE m.id=?',
      [id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { type, frequency, scheduled_date, description, cost, status } = req.body;
    await pool.execute(
      'UPDATE maintenance_schedules SET type=?,frequency=?,scheduled_date=?,description=?,cost=?,status=? WHERE id=? AND org_id=?',
      [type || 'preventive', frequency || 'monthly', scheduled_date, description || '', cost || 0, status || 'scheduled', req.params.id, req.orgId]
    );
    const [rows] = await pool.execute(
      'SELECT m.*, e.name as equipment_name FROM maintenance_schedules m JOIN equipment e ON m.equipment_id=e.id WHERE m.id=?',
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await pool.execute('DELETE FROM maintenance_schedules WHERE id=? AND org_id=?', [req.params.id, req.orgId]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function complete(req, res) {
  try {
    const { notes, cost, next_due_date } = req.body;
    await pool.execute(
      'UPDATE maintenance_schedules SET status="completed",completed_date=CURDATE(),notes=?,cost=?,next_due_date=? WHERE id=? AND org_id=?',
      [notes || '', cost || 0, next_due_date || null, req.params.id, req.orgId]
    );
    res.json({ success: true, message: 'Marked complete' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listConditionReports(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT cr.*, e.name as equipment_name, u.name as reported_by_name
       FROM condition_reports cr
       JOIN equipment e ON cr.equipment_id=e.id
       LEFT JOIN users u ON cr.reported_by=u.id
       WHERE cr.org_id=? ORDER BY cr.created_at DESC`,
      [req.orgId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createConditionReport(req, res) {
  try {
    const { equipment_id, booking_id, damage_level, description, repair_required } = req.body;
    if (!equipment_id) return res.status(400).json({ success: false, message: 'equipment_id required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO condition_reports (id,org_id,equipment_id,booking_id,reported_by,damage_level,description,repair_required) VALUES (?,?,?,?,?,?,?,?)',
      [id, req.orgId, equipment_id, booking_id || null, req.user.id, damage_level || 'none', description || '', repair_required ? 1 : 0]
    );
    const [rows] = await pool.execute(
      'SELECT cr.*, e.name as equipment_name FROM condition_reports cr JOIN equipment e ON cr.equipment_id=e.id WHERE cr.id=?',
      [id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { list, create, update, remove, complete, listConditionReports, createConditionReport };
