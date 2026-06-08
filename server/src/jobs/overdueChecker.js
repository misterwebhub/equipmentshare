const cron = require('node-cron');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function startOverdueChecker() {
  cron.schedule('0 * * * *', async () => {
    try {
      await pool.execute(`UPDATE bookings SET status='overdue' WHERE status='active' AND end_date < CURDATE()`);
      const [overdueBookings] = await pool.execute(
        `SELECT b.id,b.org_id,b.customer_id,b.fixed_rate,DATEDIFF(CURDATE(),b.end_date) as days_overdue FROM bookings b WHERE b.status='overdue' AND NOT EXISTS (SELECT 1 FROM penalties p WHERE p.booking_id=b.id AND p.type='late_return')`
      );
      for (const booking of overdueBookings) {
        if (booking.days_overdue > 0 && booking.fixed_rate) {
          const amount = booking.days_overdue * booking.fixed_rate;
          await pool.execute(
            `INSERT INTO penalties (id,org_id,booking_id,customer_id,type,amount,days_overdue,description) VALUES (?,?,?,?,'late_return',?,?,?)`,
            [uuidv4(),booking.org_id,booking.id,booking.customer_id,amount,booking.days_overdue,`Late return: ${booking.days_overdue} day(s) overdue`]
          );
        }
      }
      if (overdueBookings.length) console.log(`Auto-penalised ${overdueBookings.length} overdue bookings`);
    } catch (err) { console.error('Overdue checker error:', err.message); }
  });
  console.log('Overdue auto-checker started (runs hourly)');
}

module.exports = { startOverdueChecker };
