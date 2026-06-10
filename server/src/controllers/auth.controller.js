const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const jwtConfig = require('../config/jwt');

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  const refreshToken = jwt.sign({ id: userId }, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
  return { accessToken, refreshToken };
}

async function register(req, res) {
  try {
    const { orgName, category, email, phone, address, password, planId } = req.body;
    if (!orgName || !email || !password)
      return res.status(400).json({ success: false, message: 'Organisation name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    let finalPlanId = planId;
    if (!finalPlanId) {
      const [plans] = await pool.execute('SELECT id FROM plans WHERE name = "Starter" LIMIT 1');
      finalPlanId = plans[0]?.id;
    }

    const orgId = uuidv4();
    const userId = uuidv4();
    const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + orgId.slice(0, 6);
    const hash = await bcrypt.hash(password, 10);

    await pool.execute(
      `INSERT INTO organisations (id, name, slug, category, email, phone, address, plan_id, status, trial_ends_at) VALUES (?,?,?,?,?,?,?,?,'trial',DATE_ADD(NOW(), INTERVAL 14 DAY))`,
      [orgId, orgName, slug, category || 'construction', email, phone || '', address || '', finalPlanId]
    );
    await pool.execute(
      `INSERT INTO users (id, org_id, name, email, password_hash, role, status) VALUES (?,?,?,?,?,'admin','active')`,
      [userId, orgId, orgName + ' Admin', email, hash]
    );

    if (finalPlanId) {
      const [planRows] = await pool.execute('SELECT price_monthly FROM plans WHERE id = ?', [finalPlanId]);
      await pool.execute(
        `INSERT INTO subscriptions (id,org_id,plan_id,status,billing_cycle,starts_at,ends_at,amount) VALUES (?,?,?,'trial','monthly',NOW(),DATE_ADD(NOW(), INTERVAL 14 DAY),?)`,
        [uuidv4(), orgId, finalPlanId, planRows[0]?.price_monthly || 0]
      );
    }

    const { accessToken, refreshToken } = generateTokens(userId);
    await pool.execute(
      `INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [uuidv4(), userId, refreshToken]
    );

    const [user] = await pool.execute('SELECT id,org_id,name,email,role FROM users WHERE id=?', [userId]);
    const [org] = await pool.execute('SELECT id,name,slug,category,email,status FROM organisations WHERE id=?', [orgId]);

    res.status(201).json({
      success: true,
      message: 'Organisation registered. 14-day free trial started.',
      data: { accessToken, refreshToken, user: user[0], organisation: org[0] },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];
    if (user.status !== 'active')
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact your administrator.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await pool.execute(
      `INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [uuidv4(), user.id, refreshToken]
    );
    await pool.execute('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);

    let org = null;
    if (user.org_id) {
      const [orgRows] = await pool.execute(
        'SELECT id,name,slug,category,email,phone,status,plan_id,logo_url FROM organisations WHERE id=?',
        [user.org_id]
      );
      org = orgRows[0] || null;
    }

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, org_id: user.org_id, name: user.name, email: user.email, role: user.role },
        organisation: org,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const [rows] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE user_id=? AND expires_at > NOW() LIMIT 1',
      [decoded.id]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id);
    await pool.execute('DELETE FROM refresh_tokens WHERE user_id=?', [decoded.id]);
    await pool.execute(
      `INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [uuidv4(), decoded.id, newRefresh]
    );
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}

async function me(req, res) {
  try {
    let org = null;
    if (req.user.org_id) {
      const [orgRows] = await pool.execute(
        'SELECT id,name,slug,category,email,phone,address,status,plan_id,logo_url,currency,date_format,number_format,timezone FROM organisations WHERE id=?',
        [req.user.org_id]
      );
      org = orgRows[0] || null;
    }
    res.json({ success: true, data: { user: req.user, organisation: org } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await pool.execute('DELETE FROM refresh_tokens WHERE user_id=?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, refresh, me, logout };
