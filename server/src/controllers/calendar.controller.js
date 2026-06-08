const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function getEvents(req, res) {
  try {
    const { from, to, equipment_id } = req.query;
    let bParams = [req.orgId];
    let bSql = `SELECT b.id, 'rental' as event_type, b.start_date, b.end_date, b.status,
                e.name as equipment_name, e.id as equipment_id, c.name as customer_name
                FROM bookings b JOIN equipment e ON b.equipment_id=e.id JOIN customers c ON b.customer_id=c.id
                WHERE b.org_id=? AND b.status NOT IN ('cancelled')`;
    if (from) { bSql += ' AND b.end_date>=?'; bParams.push(from); }
    if (to) { bSql += ' AND b.start_date<=?'; bParams.push(to); }
    if (equipment_id) { bSql += ' AND b.equipment_id=?'; bParams.push(equipment_id); }
    const [bookings] = await pool.execute(bSql, bParams);

    let mParams = [req.orgId];
    let mSql = `SELECT m.id, 'maintenance' as event_type, m.scheduled_date as start_date, m.scheduled_date as end_date,
                m.status, e.name as equipment_name, e.id as equipment_id, m.description as title
                FROM maintenance_schedules m JOIN equipment e ON m.equipment_id=e.id
                WHERE m.org_id=?`;
    if (from) { mSql += ' AND m.scheduled_date>=?'; mParams.push(from); }
    if (to) { mSql += ' AND m.scheduled_date<=?'; mParams.push(to); }
    if (equipment_id) { mSql += ' AND m.equipment_id=?'; mParams.push(equipment_id); }
    const [maintenance] = await pool.execute(mSql, mParams);

    res.json({ success: true, data: [...bookings, ...maintenance] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function blockDates(req, res) {
  try {
    const { equipment_id, start_date, end_date, reason } = req.body;
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO calendar_blocks (id,org_id,equipment_id,start_date,end_date,reason) VALUES (?,?,?,?,?,?)',
      [id, req.orgId, equipment_id, start_date, end_date, reason || '']
    );
    res.status(201).json({ success: true, message: 'Dates blocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getEvents, blockDates };
