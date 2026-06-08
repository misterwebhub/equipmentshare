const { pool } = require('../config/database');

/**
 * GET /api/public/pricing
 * Returns all active plans for the landing page / signup flow.
 * No authentication required.
 */
async function getPricing(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, price_monthly, price_yearly, max_equipment, max_users, features
       FROM plans
       WHERE is_active = 1
       ORDER BY price_monthly ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getPricing };
