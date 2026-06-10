const cron = require('node-cron');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/* ── Helper: insert notification (deduped by type+resource per org per day) ── */
async function notify(orgId, type, title, message) {
  try {
    // Avoid duplicate notifications for the same type+title today
    const [[existing]] = await pool.execute(
      `SELECT id FROM notifications WHERE org_id=? AND type=? AND title=? AND DATE(created_at)=CURDATE() LIMIT 1`,
      [orgId, type, title]
    );
    if (existing) return;
    await pool.execute(
      `INSERT INTO notifications (id, org_id, type, title, message) VALUES (?,?,?,?,?)`,
      [uuidv4(), orgId, type, title, message]
    );
  } catch (err) {
    console.error('notify() error:', err.message);
  }
}

function startOverdueChecker() {
  // ── Run immediately on startup, then every hour ──
  runChecks();
  cron.schedule('0 * * * *', runChecks);
  console.log('Overdue auto-checker started (runs hourly + on startup)');
}

async function runChecks() {
  try {
    /* ── 1. Mark active bookings as overdue ── */
    await pool.execute(
      `UPDATE bookings SET status='overdue' WHERE status='active' AND end_date < CURDATE()`
    );

    /* ── 2. Auto-create late-return penalties ── */
    const [overdueBookings] = await pool.execute(
      `SELECT b.id, b.org_id, b.customer_id, b.invoice_number,
              b.fixed_rate, DATEDIFF(CURDATE(), b.end_date) AS days_overdue,
              c.name AS customer_name, e.name AS equipment_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN equipment e ON b.equipment_id = e.id
       WHERE b.status = 'overdue'
         AND NOT EXISTS (
           SELECT 1 FROM penalties p
           WHERE p.booking_id = b.id AND p.type = 'late_return'
         )`
    );

    for (const booking of overdueBookings) {
      if (booking.days_overdue > 0 && booking.fixed_rate) {
        const amount = booking.days_overdue * booking.fixed_rate;
        await pool.execute(
          `INSERT INTO penalties (id, org_id, booking_id, customer_id, type, amount, days_overdue, description)
           VALUES (?, ?, ?, ?, 'late_return', ?, ?, ?)`,
          [
            uuidv4(), booking.org_id, booking.id, booking.customer_id,
            amount, booking.days_overdue,
            `Late return: ${booking.days_overdue} day(s) overdue`,
          ]
        );
      }

      // Notification: overdue booking
      await notify(
        booking.org_id,
        'booking_overdue',
        `Overdue: ${booking.equipment_name}`,
        `Booking ${booking.invoice_number || booking.id} for ${booking.customer_name} is ${booking.days_overdue} day(s) overdue. A late-return penalty has been applied.`
      );
    }

    if (overdueBookings.length) {
      console.log(`[overdueChecker] Auto-penalised ${overdueBookings.length} overdue bookings`);
    }

    /* ── 3. Notify: bookings due for return TODAY ── */
    const [dueToday] = await pool.execute(
      `SELECT b.id, b.org_id, b.invoice_number, c.name AS customer_name, e.name AS equipment_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN equipment e ON b.equipment_id = e.id
       WHERE b.status = 'active' AND b.end_date = CURDATE()`
    );
    for (const b of dueToday) {
      await notify(
        b.org_id,
        'booking_due_today',
        `Due today: ${b.equipment_name}`,
        `Booking ${b.invoice_number || b.id} for ${b.customer_name} is due for return today.`
      );
    }

    /* ── 4. Notify: bookings due in 2 days ── */
    const [dueSoon] = await pool.execute(
      `SELECT b.id, b.org_id, b.invoice_number, c.name AS customer_name, e.name AS equipment_name,
              b.end_date
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN equipment e ON b.equipment_id = e.id
       WHERE b.status = 'active' AND b.end_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)`
    );
    for (const b of dueSoon) {
      await notify(
        b.org_id,
        'booking_due_soon',
        `Due in 2 days: ${b.equipment_name}`,
        `Booking ${b.invoice_number || b.id} for ${b.customer_name} is due for return in 2 days (${b.end_date}).`
      );
    }

    /* ── 5. Notify: maintenance due within 7 days ── */
    const [maintenanceDue] = await pool.execute(
      `SELECT ms.id, ms.org_id, ms.scheduled_date, ms.type, ms.frequency,
              e.name AS equipment_name
       FROM maintenance_schedules ms
       JOIN equipment e ON ms.equipment_id = e.id
       WHERE ms.status IN ('scheduled','overdue')
         AND ms.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
    );
    for (const ms of maintenanceDue) {
      const daysUntil = Math.max(0, Math.ceil(
        (new Date(ms.scheduled_date) - new Date()) / 86_400_000
      ));
      const when = daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
      await notify(
        ms.org_id,
        'maintenance_due',
        `Maintenance due ${when}: ${ms.equipment_name}`,
        `${ms.type} maintenance for ${ms.equipment_name} is scheduled ${when} (${ms.scheduled_date}).`
      );
    }

    /* ── 6. Notify: overdue maintenance (past scheduled date, not completed) ── */
    const [maintenanceOverdue] = await pool.execute(
      `SELECT ms.id, ms.org_id, ms.scheduled_date, ms.type,
              e.name AS equipment_name,
              DATEDIFF(CURDATE(), ms.scheduled_date) AS days_overdue
       FROM maintenance_schedules ms
       JOIN equipment e ON ms.equipment_id = e.id
       WHERE ms.status NOT IN ('completed','skipped')
         AND ms.scheduled_date < CURDATE()`
    );
    for (const ms of maintenanceOverdue) {
      // Auto-mark as overdue in DB
      await pool.execute(
        `UPDATE maintenance_schedules SET status='overdue' WHERE id=? AND status='scheduled'`,
        [ms.id]
      );
      await notify(
        ms.org_id,
        'maintenance_overdue',
        `Maintenance overdue: ${ms.equipment_name}`,
        `${ms.type} maintenance for ${ms.equipment_name} was scheduled on ${ms.scheduled_date} and is ${ms.days_overdue} day(s) overdue.`
      );
    }

    const totalNotifs = dueToday.length + dueSoon.length + maintenanceDue.length + maintenanceOverdue.length;
    if (totalNotifs > 0) {
      console.log(`[overdueChecker] Created notifications — due today: ${dueToday.length}, due soon: ${dueSoon.length}, maintenance: ${maintenanceDue.length + maintenanceOverdue.length}`);
    }

  } catch (err) {
    console.error('[overdueChecker] Error:', err.message);
  }
}

module.exports = { startOverdueChecker };
