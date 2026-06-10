require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { startOverdueChecker } = require('./jobs/overdueChecker');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'EquipTrack Pro API', timestamp: new Date().toISOString() }));

app.use('/api/public',      require('./routes/public.routes'));
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/equipment',       require('./routes/equipment.routes'));
app.use('/api/equipment-units', require('./routes/equipment-units.routes'));
app.use('/api/categories',  require('./routes/categories.routes'));
app.use('/api/customers',   require('./routes/customers.routes'));
app.use('/api/bookings',    require('./routes/bookings.routes'));
app.use('/api/penalties',   require('./routes/penalties.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/reports',     require('./routes/reports.routes'));
app.use('/api/users',       require('./routes/users.routes'));
app.use('/api/settings',    require('./routes/settings.routes'));
app.use('/api/calendar',    require('./routes/calendar.routes'));
app.use('/api/superadmin',        require('./routes/superadmin.routes'));
app.use('/api/notifications',     require('./routes/notifications.routes'));
app.use('/api/condition-reports', require('./routes/condition-reports.routes'));
app.use('/api/support-tickets',   require('./routes/support-tickets.routes'));
app.use('/api/activity',          require('./routes/activity.routes'));
app.use('/api/demo-seed',         require('./routes/demo-seed.routes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await testConnection();
  startOverdueChecker();
  app.listen(PORT, () => {
    console.log(`\nEquipTrack Pro API running at http://localhost:${PORT}`);
    console.log(`CORS allowed for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
  });
}

bootstrap();
