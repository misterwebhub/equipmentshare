const { pool } = require('../config/database');

async function dashboardStats(req, res) {
  try {
    const id = req.orgId;
    const [[equip]] = await pool.execute(
      `SELECT COUNT(*) as total,
       COALESCE(SUM(status="available"),0) as available,
       COALESCE(SUM(status="rented-out"),0) as rented,
       COALESCE(SUM(status="maintenance"),0) as maintenance
       FROM equipment WHERE org_id=? AND deleted_at IS NULL`,
      [id]
    );
    const [[book]] = await pool.execute(
      `SELECT COALESCE(SUM(status="active"),0) as active,
       COALESCE(SUM(status="overdue"),0) as overdue,
       COALESCE(SUM(status="pending"),0) as pending
       FROM bookings WHERE org_id=?`,
      [id]
    );
    const [[rev]] = await pool.execute(
      `SELECT COALESCE(SUM(actual_cost),0) as month_revenue
       FROM bookings WHERE org_id=? AND status="completed"
       AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())`,
      [id]
    );
    const [[pen]] = await pool.execute(
      `SELECT COALESCE(SUM(amount),0) as pending_penalties FROM penalties WHERE org_id=? AND status="pending"`,
      [id]
    );
    const [[maint]] = await pool.execute(
      `SELECT COUNT(*) as count FROM maintenance_schedules
       WHERE org_id=? AND status IN ("scheduled","overdue") AND scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [id]
    );
    const [recentBookings] = await pool.execute(
      `SELECT b.id,b.status,b.start_date,b.end_date,b.estimated_cost,b.actual_cost,
       c.name as customer_name, e.name as equipment_name
       FROM bookings b JOIN customers c ON b.customer_id=c.id JOIN equipment e ON b.equipment_id=e.id
       WHERE b.org_id=? ORDER BY b.created_at DESC LIMIT 8`,
      [id]
    );
    const [upcomingMaint] = await pool.execute(
      `SELECT m.*, e.name as equipment_name FROM maintenance_schedules m
       JOIN equipment e ON m.equipment_id=e.id
       WHERE m.org_id=? AND m.status='scheduled'
       AND m.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY m.scheduled_date ASC LIMIT 5`,
      [id]
    );
    res.json({
      success: true,
      data: {
        equipment: equip,
        bookings: book,
        revenue: rev,
        penalties: pen,
        maintenance_alerts: maint.count,
        recent_bookings: recentBookings,
        upcoming_maintenance: upcomingMaint,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function revenue(req, res) {
  try {
    const { months = 6 } = req.query;
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as bookings_count, COALESCE(SUM(actual_cost),0) as revenue
       FROM bookings WHERE org_id=? AND status='completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month`,
      [req.orgId, parseInt(months)]
    );
    const [byEquipment] = await pool.execute(
      `SELECT e.name, COALESCE(SUM(b.actual_cost),0) as revenue, COUNT(b.id) as bookings
       FROM bookings b JOIN equipment e ON b.equipment_id=e.id
       WHERE b.org_id=? AND b.status='completed' GROUP BY e.id ORDER BY revenue DESC LIMIT 10`,
      [req.orgId]
    );
    const [byCustomer] = await pool.execute(
      `SELECT c.name, COALESCE(SUM(b.actual_cost),0) as revenue, COUNT(b.id) as bookings
       FROM bookings b JOIN customers c ON b.customer_id=c.id
       WHERE b.org_id=? AND b.status='completed' GROUP BY c.id ORDER BY revenue DESC LIMIT 10`,
      [req.orgId]
    );
    res.json({ success: true, data: { monthly, by_equipment: byEquipment, by_customer: byCustomer } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function utilisation(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, e.name, e.status,
       COUNT(b.id) as total_bookings,
       COALESCE(SUM(DATEDIFF(b.end_date,b.start_date)),0) as total_days_booked,
       COALESCE(SUM(b.actual_cost),0) as total_revenue
       FROM equipment e
       LEFT JOIN bookings b ON e.id=b.equipment_id AND b.status='completed'
       WHERE e.org_id=? AND e.deleted_at IS NULL
       GROUP BY e.id ORDER BY total_revenue DESC`,
      [req.orgId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { dashboardStats, revenue, utilisation };
