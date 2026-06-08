import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './store.js';
import { seed } from './seed.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { crudRouter } from './routes/crudRoutes.js';
import lifecycleRoutes from './routes/lifecycleRoutes.js';
import { authenticate } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Seed on boot so the API is usable immediately.
seed();

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Public plans (used by the pricing/subscribe pages before auth completes).
app.get('/api/plans', (req, res) => res.json(db.plans));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Tenant-scoped module collections — each gets full CRUD automatically.
app.use('/api/equipment', crudRouter('equipment', 'equip'));
app.use('/api/rentals', crudRouter('rentals', 'rental'));
app.use('/api/customers', crudRouter('companies', 'comp'));
app.use('/api/people', crudRouter('people', 'person'));
app.use('/api/projects', crudRouter('projects', 'proj'));
app.use('/api/maintenance', crudRouter('maintenance', 'maint'));
app.use('/api/condition-reports', crudRouter('conditionReports', 'cond'));
app.use('/api/deliveries', crudRouter('deliveries', 'deliv'));
app.use('/api/notifications', crudRouter('notifications', 'notif'));
app.use('/api/penalties', crudRouter('penalties', 'penalty'));
app.use('/api/tickets', crudRouter('tickets', 'ticket'));
app.use('/api/calendar', crudRouter('calendarEvents', 'cal'));

// Quote -> Order -> Invoice -> Return/charges lifecycle (+ PDF + email).
app.use('/api', lifecycleRoutes);

// Org listing for the current user (used by team/settings).
app.get('/api/users', authenticate, (req, res) => {
  const orgId = req.user.role === 'superadmin' ? req.query.orgId : req.user.orgId;
  const rows = db.users
    .filter((u) => u.role !== 'superadmin' && (!orgId || u.orgId === orgId))
    .map(({ passwordHash, ...rest }) => rest);
  res.json(rows);
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`EquipTrack API listening on http://localhost:${PORT}`);
  console.log('Seeded:', Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length])));
});
