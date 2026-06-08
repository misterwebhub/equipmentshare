const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function getDashboard(req, res) {
  try {
    const [[orgStats]] = await pool.execute(
      `SELECT COUNT(*) as total,
       COALESCE(SUM(status='active'),0) as active,
       COALESCE(SUM(status='trial'),0) as trial,
       COALESCE(SUM(status='suspended'),0) as suspended
       FROM organisations`
    );
    const [[mrr]] = await pool.execute(
      `SELECT COALESCE(SUM(amount),0) as total FROM subscriptions WHERE status='active' AND billing_cycle='monthly'`
    );
    const [[newOrgs]] = await pool.execute(
      `SELECT COUNT(*) as count FROM organisations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [recentOrgs] = await pool.execute(
      `SELECT o.*, p.name as plan_name FROM organisations o LEFT JOIN plans p ON o.plan_id=p.id ORDER BY o.created_at DESC LIMIT 5`
    );
    res.json({
      success: true,
      data: { organisations: orgStats, mrr: mrr.total, new_orgs_30d: newOrgs.count, recent_organisations: recentOrgs },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listOrganisations(req, res) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let sql = `SELECT o.*, p.name as plan_name, p.price_monthly,
               COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT e.id) as equipment_count,
               s.status as sub_status, s.ends_at as sub_ends_at
               FROM organisations o
               LEFT JOIN plans p ON o.plan_id=p.id
               LEFT JOIN users u ON o.id=u.org_id
               LEFT JOIN equipment e ON o.id=e.org_id AND e.deleted_at IS NULL
               LEFT JOIN subscriptions s ON o.id=s.org_id AND s.status='active'
               WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND o.name LIKE ?'; params.push(`%${search}%`); }
    if (status) { sql += ' AND o.status=?'; params.push(status); }
    sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const [rows] = await pool.execute(sql, params);
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM organisations');
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getOrganisation(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM organisations WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const [users] = await pool.execute('SELECT id,name,email,role,status,last_login FROM users WHERE org_id=?', [req.params.id]);
    const [subs] = await pool.execute(
      'SELECT s.*, p.name as plan_name FROM subscriptions s JOIN plans p ON s.plan_id=p.id WHERE s.org_id=? ORDER BY s.created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], users, subscriptions: subs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateOrgStatus(req, res) {
  try {
    await pool.execute('UPDATE organisations SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ success: true, message: 'Organisation status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listSubscriptions(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, o.name as org_name, o.email as org_email, p.name as plan_name, p.price_monthly
       FROM subscriptions s JOIN organisations o ON s.org_id=o.id JOIN plans p ON s.plan_id=p.id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createSubscription(req, res) {
  try {
    const { org_id, plan_id, billing_cycle, starts_at, ends_at, amount, notes, status } = req.body;
    if (!org_id || !plan_id || !starts_at)
      return res.status(400).json({ success: false, message: 'org_id, plan_id, starts_at required' });
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO subscriptions (id,org_id,plan_id,status,billing_cycle,starts_at,ends_at,amount,notes,is_manual,created_by) VALUES (?,?,?,?,?,?,?,?,?,1,?)`,
      [id, org_id, plan_id, status || 'active', billing_cycle || 'monthly', starts_at, ends_at || null, amount || 0, notes || '', req.user.id]
    );
    await pool.execute('UPDATE organisations SET plan_id=?,status="active" WHERE id=?', [plan_id, org_id]);
    const [rows] = await pool.execute(
      'SELECT s.*, o.name as org_name, p.name as plan_name FROM subscriptions s JOIN organisations o ON s.org_id=o.id JOIN plans p ON s.plan_id=p.id WHERE s.id=?',
      [id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateSubscription(req, res) {
  try {
    const { plan_id, status, billing_cycle, starts_at, ends_at, amount, notes } = req.body;
    await pool.execute(
      'UPDATE subscriptions SET plan_id=?,status=?,billing_cycle=?,starts_at=?,ends_at=?,amount=?,notes=? WHERE id=?',
      [plan_id, status, billing_cycle || 'monthly', starts_at, ends_at || null, amount || 0, notes || '', req.params.id]
    );
    res.json({ success: true, message: 'Subscription updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function cancelSubscription(req, res) {
  try {
    await pool.execute('UPDATE subscriptions SET status="cancelled" WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listPlans(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM plans ORDER BY price_monthly');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createPlan(req, res) {
  try {
    const { name, price_monthly, price_yearly, max_equipment, max_users, features, is_active } = req.body;
    if (!name || price_monthly == null)
      return res.status(400).json({ success: false, message: 'name and price_monthly required' });
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO plans (id,name,price_monthly,price_yearly,max_equipment,max_users,features,is_active) VALUES (?,?,?,?,?,?,?,?)',
      [id, name, price_monthly, price_yearly || 0, max_equipment || 25, max_users || 3, JSON.stringify(features || {}), is_active ?? 1]
    );
    const [rows] = await pool.execute('SELECT * FROM plans WHERE id=?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updatePlan(req, res) {
  try {
    const { name, price_monthly, price_yearly, max_equipment, max_users, features, is_active } = req.body;
    await pool.execute(
      'UPDATE plans SET name=?,price_monthly=?,price_yearly=?,max_equipment=?,max_users=?,features=?,is_active=? WHERE id=?',
      [name, price_monthly, price_yearly || 0, max_equipment || 25, max_users || 3, JSON.stringify(features || {}), is_active ?? 1, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM plans WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard, listOrganisations, getOrganisation, updateOrgStatus,
  listSubscriptions, createSubscription, updateSubscription, cancelSubscription,
  listPlans, createPlan, updatePlan,
};
