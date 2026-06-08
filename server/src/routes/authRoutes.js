import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, nextId, insert } from '../store.js';
import { signToken, authenticate } from '../auth.js';

const router = Router();

/** POST /api/auth/login */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive' });

  const org = user.orgId ? db.organizations.find((o) => o.id === user.orgId) : null;
  const subscription = org ? db.subscriptions.find((s) => s.orgId === org.id) : null;

  res.json({ token: signToken(user), user: safeUser(user), org, subscription });
});

/**
 * POST /api/auth/register
 * Self-serve org signup: creates an organization, its admin user, and a
 * (pending, no-plan) subscription. The subscribe step assigns a plan.
 */
router.post('/register', (req, res) => {
  const { orgName, category, name, email, password, phone, address } = req.body || {};
  if (!orgName || !name || !email || !password) {
    return res.status(400).json({ error: 'orgName, name, email and password are required' });
  }
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const org = insert('organizations', {
    id: nextId('org'),
    name: orgName,
    slug: String(orgName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category: category || 'other',
    email,
    phone: phone || '',
    address: address || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  const user = insert('users', {
    id: nextId('user'),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 8),
    role: 'admin',
    orgId: org.id,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  const subscription = insert('subscriptions', {
    id: nextId('sub'),
    orgId: org.id,
    planId: null,
    status: 'pending',
    startedAt: null,
    currentPeriodEnd: null,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ token: signToken(user), user: safeUser(user), org, subscription });
});

/** POST /api/auth/subscribe — assign/activate a plan for the current org. */
router.post('/subscribe', authenticate, (req, res) => {
  const { planId } = req.body || {};
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });
  if (!req.user.orgId) return res.status(400).json({ error: 'No organization on this account' });

  let sub = db.subscriptions.find((s) => s.orgId === req.user.orgId);
  const periodEnd = new Date(Date.now() + 30 * 864e5).toISOString();
  if (sub) {
    Object.assign(sub, { planId, status: 'active', startedAt: new Date().toISOString(), currentPeriodEnd: periodEnd });
  } else {
    sub = insert('subscriptions', {
      id: nextId('sub'), orgId: req.user.orgId, planId, status: 'active',
      startedAt: new Date().toISOString(), currentPeriodEnd: periodEnd, createdAt: new Date().toISOString(),
    });
  }
  res.json({ subscription: sub, plan });
});

/** GET /api/auth/me — current user + org + subscription. */
router.get('/me', authenticate, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const org = user.orgId ? db.organizations.find((o) => o.id === user.orgId) : null;
  const subscription = org ? db.subscriptions.find((s) => s.orgId === org.id) : null;
  res.json({ user: safeUser(user), org, subscription });
});

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export default router;
