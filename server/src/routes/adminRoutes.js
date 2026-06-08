import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, nextId, insert, find, update, remove } from '../store.js';
import { authenticate, requireSuperAdmin } from '../auth.js';

const router = Router();
router.use(authenticate, requireSuperAdmin);

/** GET /api/admin/stats — platform-wide overview. */
router.get('/stats', (req, res) => {
  const activeSubs = db.subscriptions.filter((s) => s.status === 'active');
  const mrr = activeSubs.reduce((sum, s) => {
    const plan = db.plans.find((p) => p.id === s.planId);
    return sum + (plan?.price || 0);
  }, 0);
  res.json({
    totalOrganizations: db.organizations.length,
    activeOrganizations: db.organizations.filter((o) => o.status === 'active').length,
    totalUsers: db.users.filter((u) => u.role !== 'superadmin').length,
    totalEquipment: db.equipment.length,
    activeSubscriptions: activeSubs.length,
    trialingSubscriptions: db.subscriptions.filter((s) => s.status === 'trialing').length,
    mrr,
  });
});

/** GET /api/admin/organizations — every org with its subscription + counts. */
router.get('/organizations', (req, res) => {
  const rows = db.organizations.map((o) => {
    const subscription = db.subscriptions.find((s) => s.orgId === o.id) || null;
    const plan = subscription ? db.plans.find((p) => p.id === subscription.planId) : null;
    return {
      ...o,
      subscription,
      plan,
      userCount: db.users.filter((u) => u.orgId === o.id).length,
      equipmentCount: db.equipment.filter((e) => e.orgId === o.id).length,
      rentalCount: db.rentals.filter((r) => r.orgId === o.id).length,
    };
  });
  res.json(rows);
});

/** POST /api/admin/organizations — super admin creates an org + its admin user. */
router.post('/organizations', (req, res) => {
  const { name, category, adminName, adminEmail, adminPassword, phone, address, planId } = req.body || {};
  if (!name || !adminEmail || !adminPassword || !adminName) {
    return res.status(400).json({ error: 'name, adminName, adminEmail, adminPassword required' });
  }
  if (db.users.some((u) => u.email.toLowerCase() === String(adminEmail).toLowerCase())) {
    return res.status(409).json({ error: 'Admin email already in use' });
  }
  const org = insert('organizations', {
    id: nextId('org'), name, slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category: category || 'other', email: adminEmail, phone: phone || '', address: address || '',
    status: 'active', createdAt: new Date().toISOString(),
  });
  insert('users', {
    id: nextId('user'), name: adminName, email: adminEmail, passwordHash: bcrypt.hashSync(adminPassword, 8),
    role: 'admin', orgId: org.id, status: 'active', createdAt: new Date().toISOString(),
  });
  const subscription = insert('subscriptions', {
    id: nextId('sub'), orgId: org.id, planId: planId || null,
    status: planId ? 'active' : 'pending',
    startedAt: planId ? new Date().toISOString() : null,
    currentPeriodEnd: planId ? new Date(Date.now() + 30 * 864e5).toISOString() : null,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ ...org, subscription });
});

/** PUT /api/admin/organizations/:id — update org details / status. */
router.put('/organizations/:id', (req, res) => {
  const { id: _i, ...patch } = req.body || {};
  const org = update('organizations', req.params.id, patch);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

/** DELETE /api/admin/organizations/:id — remove org and its tenant data. */
router.delete('/organizations/:id', (req, res) => {
  const ok = remove('organizations', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Organization not found' });
  // Cascade: drop all tenant-scoped rows.
  ['subscriptions', 'users', 'companies', 'people', 'equipment', 'projects', 'rentals',
   'maintenance', 'conditionReports', 'deliveries', 'notifications', 'penalties',
   'tickets', 'calendarEvents'].forEach((c) => {
    db[c] = db[c].filter((r) => r.orgId !== req.params.id);
  });
  res.status(204).end();
});

/** GET /api/admin/plans */
router.get('/plans', (req, res) => res.json(db.plans));

/** GET /api/admin/subscriptions */
router.get('/subscriptions', (req, res) => {
  res.json(db.subscriptions.map((s) => ({
    ...s,
    organization: db.organizations.find((o) => o.id === s.orgId) || null,
    plan: db.plans.find((p) => p.id === s.planId) || null,
  })));
});

/**
 * PUT /api/admin/subscriptions/:orgId — manually set/override a subscription.
 * This is the "add or delete subscription manually" capability for the owner.
 * Body: { planId, status }  (status: active|trialing|cancelled|past_due|pending)
 */
router.put('/subscriptions/:orgId', (req, res) => {
  const { planId, status } = req.body || {};
  let sub = db.subscriptions.find((s) => s.orgId === req.params.orgId);
  const patch = {};
  if (planId !== undefined) patch.planId = planId;
  if (status !== undefined) patch.status = status;
  if (status === 'active') {
    patch.startedAt = patch.startedAt || new Date().toISOString();
    patch.currentPeriodEnd = new Date(Date.now() + 30 * 864e5).toISOString();
  }
  if (sub) {
    Object.assign(sub, patch, { updatedAt: new Date().toISOString() });
  } else {
    sub = insert('subscriptions', {
      id: nextId('sub'), orgId: req.params.orgId, planId: planId || null,
      status: status || 'active', startedAt: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 864e5).toISOString(), createdAt: new Date().toISOString(),
    });
  }
  res.json(sub);
});

/** DELETE /api/admin/subscriptions/:orgId — remove a subscription (downgrade to none). */
router.delete('/subscriptions/:orgId', (req, res) => {
  const sub = db.subscriptions.find((s) => s.orgId === req.params.orgId);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  sub.status = 'cancelled';
  sub.planId = null;
  res.json(sub);
});

export default router;
