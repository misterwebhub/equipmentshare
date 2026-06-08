import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'equiptrack-dev-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, orgId: user.orgId, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** Populates req.user from the Bearer token. 401 if missing/invalid. */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restrict a route to the super admin. */
export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

/**
 * Resolve the tenant scope for the current request.
 * - Super admin may pass ?orgId=... to act within a tenant, or omit it to see all.
 * - Org users are always locked to their own orgId.
 * Returns undefined to mean "no filter" (super admin, all tenants).
 */
export function tenantScope(req) {
  if (req.user.role === 'superadmin') {
    return req.query.orgId || undefined;
  }
  return req.user.orgId;
}
