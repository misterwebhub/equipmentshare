# EquipTrack Pro — Backend Server

## Quick Start

```bash
cd server
npm install
cp .env.example .env
# Edit .env — set your MySQL credentials

npm run migrate   # Creates DB tables
npm run seed      # Inserts demo data
npm run dev       # Start with hot reload
```

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@equiptrack.com | SuperAdmin@123 |
| Org Admin | admin@buildright.com | Admin@123 |
| Org Manager | manager@buildright.com | Manager@123 |

## API Endpoints
- `POST /api/auth/register` — Register new organisation
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Current user
- `GET  /api/equipment` — List equipment (auth required)
- `GET  /api/bookings` — List bookings
- `GET  /api/customers` — List customers
- `GET  /api/maintenance` — Maintenance schedules
- `GET  /api/penalties` — Penalties
- `GET  /api/reports/dashboard-stats` — Dashboard stats
- `GET  /api/reports/revenue` — Revenue report
- `GET  /api/reports/utilisation` — Equipment utilisation
- `GET  /api/calendar/events` — Calendar events
- `GET  /api/superadmin/dashboard` — Super admin dashboard
