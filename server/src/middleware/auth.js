const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const jwtConfig = require('../config/jwt');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    const [rows] = await pool.execute(
      'SELECT id, org_id, name, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'User not found or inactive' });
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Super admin access required' });
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role) && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const orgScope = (req, res, next) => {
  if (req.user.role !== 'superadmin' && !req.user.org_id) {
    return res.status(403).json({ success: false, message: 'No organisation assigned' });
  }
  req.orgId = req.user.org_id;
  next();
};

module.exports = { authenticate, requireSuperAdmin, requireRole, orgScope };
