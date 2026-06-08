const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function list(req, res) {
  try {
    const { status, damage_level, equipment_id } = req.query;
    let sql = `SELECT cr.*, e.name as equipment_name, u.name as reporter_name,
                 eu.sku_code as unit_sku
               FROM condition_reports cr
               JOIN equipment e ON cr.equipment_id=e.id
               LEFT JOIN users u ON cr.reported_by=u.id
               LEFT JOIN equipment_units eu ON cr.equipment_unit_id=eu.id
               WHERE cr.org_id=?`;
    const params = [req.orgId];
    if (status)       { sql += ' AND cr.status=?';        params.push(status); }
    if (damage_level) { sql += ' AND cr.damage_level=?';  params.push(damage_level); }
    if (equipment_id) { sql += ' AND cr.equipment_id=?';  params.push(equipment_id); }
    sql += ' ORDER BY cr.created_at DESC LIMIT 200';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT cr.*, e.name as equipment_name, u.name as reporter_name, eu.sku_code as unit_sku
       FROM condition_reports cr
       JOIN equipment e ON cr.equipment_id=e.id
       LEFT JOIN users u ON cr.reported_by=u.id
       LEFT JOIN equipment_units eu ON cr.equipment_unit_id=eu.id
       WHERE cr.id=? AND cr.org_id=?`,
      [req.params.id, req.orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function create(req, res) {
  try {
    const { equipment_id, equipment_unit_id, booking_id, damage_level, description, photos, repair_required, repair_cost, status } = req.body;
    if (!equipment_id) return res.status(400).json({ success: false, message: 'equipment_id required' });
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO condition_reports (id,org_id,equipment_id,equipment_unit_id,booking_id,reported_by,damage_level,description,photos,repair_required,repair_cost,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.orgId, equipment_id, equipment_unit_id||null, booking_id||null,
       req.user.id, damage_level||'none', description||'',
       JSON.stringify(photos||[]), repair_required?1:0,
       parseFloat(repair_cost)||0, status||'open']
    );
    // If severe damage, auto-update equipment unit status
    if ((damage_level==='severe'||damage_level==='moderate') && equipment_unit_id) {
      await pool.execute('UPDATE equipment_units SET status="damaged" WHERE id=?', [equipment_unit_id]);
    }
    const [rows] = await pool.execute('SELECT * FROM condition_reports WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateStatus(req, res) {
  try {
    const { status, repair_cost } = req.body;
    const resolved_at = (status==='resolved') ? new Date().toISOString().slice(0,19).replace('T',' ') : null;
    await pool.execute(
      'UPDATE condition_reports SET status=?, repair_cost=COALESCE(?,repair_cost), resolved_at=COALESCE(?,resolved_at) WHERE id=? AND org_id=?',
      [status, parseFloat(repair_cost)||null, resolved_at, req.params.id, req.orgId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function stats(req, res) {
  try {
    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) as total,
         COALESCE(SUM(damage_level='none'),0) as none_count,
         COALESCE(SUM(damage_level='minor'),0) as minor,
         COALESCE(SUM(damage_level='moderate'),0) as moderate,
         COALESCE(SUM(damage_level='severe'),0) as severe,
         COALESCE(SUM(status='open'),0) as open_count,
         COALESCE(SUM(status='resolved'),0) as resolved,
         COALESCE(SUM(repair_cost),0) as total_repair_cost
       FROM condition_reports WHERE org_id=?`,
      [req.orgId]
    );
    const [byEquipment] = await pool.execute(
      `SELECT e.name, COUNT(cr.id) as reports, COALESCE(SUM(cr.repair_cost),0) as repair_cost
       FROM condition_reports cr JOIN equipment e ON cr.equipment_id=e.id
       WHERE cr.org_id=? GROUP BY e.id ORDER BY reports DESC LIMIT 10`,
      [req.orgId]
    );
    res.json({ success: true, data: { summary, by_equipment: byEquipment } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { list, getById, create, updateStatus, stats };
