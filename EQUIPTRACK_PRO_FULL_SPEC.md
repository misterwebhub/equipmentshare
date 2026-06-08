# EquipTrack Pro — Full Product Specification
### SaaS Equipment Rental Management Platform
**Version 1.0 | June 2026**
**Tech Stack: Next.js 16 (Frontend) · Node.js + Express (Backend API) · MySQL (Database)**

---

## 1. WHAT THIS SOFTWARE IS

EquipTrack Pro is a multi-tenant SaaS platform that gives equipment rental businesses — across construction, events, manufacturing, hospitality, and more — a single system to manage their entire rental lifecycle: from inventory and bookings to billing, maintenance, penalties, and reporting.

Every organisation gets its own isolated workspace. A Super Admin oversees all tenants, subscriptions, and platform health from a separate control panel.

---

## 2. WHO IT SOLVES PROBLEMS FOR

### Pain Points It Eliminates

| # | Customer Pain | How EquipTrack Pro Solves It |
|---|--------------|------------------------------|
| 1 | Equipment double-booked or lost track of | Visual booking calendar + real-time availability status |
| 2 | Paper/Excel rental agreements, prone to errors | Digital rental agreements with auto-cost calculation |
| 3 | No visibility into which equipment is earning money | Utilisation & revenue reports per equipment item |
| 4 | Late returns go unnoticed or uncharged | Automatic penalty system for overdue rentals |
| 5 | Maintenance missed, equipment breaks down expensively | Scheduled maintenance with reminders and frequency settings |
| 6 | Multiple staff accessing the same data unsafely | Role-based access (Admin, Manager, Operator, Viewer) |
| 7 | No damage tracking when equipment returns | Condition reports with damage level and photo evidence |
| 8 | SaaS owner has no control over tenants or billing | Super Admin panel with full subscription management |
| 9 | No clear pricing structure communicated to customers | Public landing page with category showcases and pricing plans |
| 10 | Organisations can't see business performance | Multi-tab analytics: revenue, utilisation, customers, trends |

---

## 3. PROJECT FLOW (END TO END)

```
PUBLIC LANDING PAGE
  ↓ (Organisation signs up / takes subscription)
ORGANISATION PANEL (login)
  ├── Dashboard
  ├── Categories
  ├── Equipment (with pricing)
  ├── Customers
  ├── Bookings / Booking Calendar
  ├── Penalties
  ├── Maintenance
  ├── Reports
  ├── Users & Roles
  └── Settings
                          ↑
SUPER ADMIN PANEL (separate login)
  ├── All Organisations
  ├── All Subscriptions (manual create/edit/cancel)
  ├── All Equipment (read-only view)
  ├── All Rentals
  ├── All Reports
  └── Platform Settings
```

---

## 4. MODULE-BY-MODULE SPECIFICATION

---

### 4.1 PUBLIC LANDING PAGE

**URL:** `/`  
**Audience:** Prospective organisations, not logged in

**Sections:**
- Hero — Bold headline targeting construction & rental pain + CTA "Start Free Trial"
- Industry categories strip — Construction | Events | Manufacturing | Hospitality | Agriculture | Healthcare (icons + brief)
- Pain-point section — "Sound familiar?" — 6 cards showing common rental nightmares
- Features overview — Equipment tracking, booking calendar, penalties, maintenance, reports, multi-user roles
- How It Works — 3-step visual: Sign Up → Add Equipment → Start Renting
- Testimonials
- **Pricing Section:**
  - **Starter** — Up to 25 equipment items, 3 users, basic reports — $49/month
  - **Professional** — Up to 200 equipment items, 15 users, full reports + calendar — $149/month
  - **Enterprise** — Unlimited equipment, unlimited users, API access, custom branding — $349/month
  - Annual discount badge (save 20%)
- FAQ
- Footer with links

**APIs Used:**
- `GET /api/public/pricing-plans` — fetches live plan data
- `POST /api/auth/register` — organisation signup
- `POST /api/auth/login` — login

---

### 4.2 AUTHENTICATION

**Pages:** `/login`, `/register`, `/forgot-password`, `/reset-password`

**Flows:**
- Organisation self-signup → selects plan → receives confirmation email → accesses panel
- Super Admin login → separate route `/superadmin/login`
- JWT-based auth (access token + refresh token)
- Passwords hashed with bcrypt

**APIs:**
```
POST /api/auth/register          — Create org + admin user
POST /api/auth/login             — Login, returns JWT
POST /api/auth/refresh           — Refresh access token
POST /api/auth/forgot-password   — Send reset email
POST /api/auth/reset-password    — Reset with token
POST /api/auth/logout            — Invalidate token
GET  /api/auth/me                — Current user profile
```

---

### 4.3 ORGANISATION DASHBOARD

**URL:** `/dashboard`  
**Access:** All logged-in org users

**KPI Cards:**
- Total Equipment / Available Now
- Active Rentals / Overdue Rentals
- Revenue This Month
- Pending Maintenance Alerts
- Outstanding Penalties Amount

**Widgets:**
- Recent Rentals table (last 10)
- Equipment Status Doughnut Chart
- Revenue Bar Chart (last 6 months)
- Upcoming Maintenance list
- Low stock / under-utilised equipment alerts

**APIs:**
```
GET /api/org/dashboard/stats         — All KPI numbers
GET /api/org/dashboard/recent-rentals
GET /api/org/dashboard/revenue-chart
GET /api/org/dashboard/maintenance-alerts
```

---

### 4.4 CATEGORY MODULE

**URL:** `/categories`  
**Purpose:** Organise equipment into logical groups (e.g., Excavators, Audio Systems, Forklifts)

**Features:**
- List all categories with equipment count
- Create / Edit / Delete category
- Sub-category support (e.g., Construction > Excavators)
- Icon / colour selection per category
- Category-level default pricing rules (optional)

**APIs:**
```
GET    /api/categories              — List all (org-scoped)
POST   /api/categories              — Create
PUT    /api/categories/:id          — Update
DELETE /api/categories/:id          — Delete
GET    /api/categories/:id/equipment — Equipment in this category
```

**DB Table:** `categories` (id, org_id, name, parent_id, icon, color, created_at)

---

### 4.5 EQUIPMENT MODULE

**URL:** `/equipment`  
**Purpose:** Full inventory management

**List View:**
- Cards or table with: name, category, status badge, pricing, condition, location, assigned person
- Search by name/category/serial
- Filter by status (available / in-use / rented-out / maintenance / damaged)
- Filter by category

**Equipment Detail Page** `/equipment/:id`:
- Full specs (name, description, serial number, category, location)
- Pricing section (fixed rate per day/week/month OR hourly rate OR both)
- Status timeline
- Assigned person & project
- Rental history
- Maintenance history
- Condition reports / damage photos
- Documents (insurance, certificates)

**Add / Edit Dialog:**
- Name, Category, Description, Serial Number
- Location, Condition (excellent / good / fair / poor)
- Pricing Type: Fixed | Hourly | Both
  - Fixed Rate + billing period (daily / weekly / monthly)
  - Hourly Rate
- Min rental period, Max rental period
- Certifications required
- Images (up to 5)
- Status

**APIs:**
```
GET    /api/equipment                — List (paginated, filtered)
GET    /api/equipment/:id            — Detail
POST   /api/equipment                — Create
PUT    /api/equipment/:id            — Update
DELETE /api/equipment/:id            — Delete (soft)
GET    /api/equipment/:id/history    — Rental history
GET    /api/equipment/:id/maintenance — Maintenance records
PATCH  /api/equipment/:id/status     — Quick status change
POST   /api/equipment/:id/images     — Upload images
```

**DB Table:** `equipment` (id, org_id, category_id, name, description, serial_number, location, condition, status, pricing_type, fixed_rate, billing_period, hourly_rate, min_period, max_period, certifications, created_at, deleted_at)

---

### 4.6 CUSTOMER MODULE

**URL:** `/customers`  
**Purpose:** Manage companies/individuals that rent equipment from the organisation

**Features:**
- Customer card/list view with: name, category, contact, active rentals count, total spend
- Add / Edit / Delete customer
- Customer detail page with full rental history, outstanding balances, penalties
- Customer categories: Individual, Small Business, Corporation, Government
- Notes / tags on customer

**APIs:**
```
GET    /api/customers               — List
GET    /api/customers/:id           — Detail
POST   /api/customers               — Create
PUT    /api/customers/:id           — Update
DELETE /api/customers/:id           — Soft delete
GET    /api/customers/:id/rentals   — Rental history
GET    /api/customers/:id/balance   — Outstanding balance
```

**DB Table:** `customers` (id, org_id, name, type, email, phone, address, tax_number, notes, status, created_at)

---

### 4.7 BOOKINGS / RENTAL MODULE

**URL:** `/bookings`  
**Purpose:** Create and manage rental agreements

**Booking List:**
- Table: Booking ID, Equipment, Customer, Person Assigned, Date Range, Pricing, Cost, Status
- Status badges: Pending | Active | Completed | Overdue | Cancelled
- Search, filter by status, date range picker

**Create Booking Form:**
- Select Customer
- Select Equipment (shows availability for selected dates)
- Assign Person (from org users)
- Start Date / End Date
- Pricing Model (Fixed / Hourly)
  - Auto-calculated estimated cost shown live
- Hours Used (if hourly)
- Security Deposit amount
- Notes
- Status (Pending / Active)

**Booking Detail Page** `/bookings/:id`:
- Full agreement info
- Cost breakdown
- Status history
- Associated penalties
- Return checklist / condition check on return
- Generate PDF rental agreement (downloadable)

**APIs:**
```
GET    /api/bookings                    — List (paginated, filtered)
GET    /api/bookings/:id                — Detail
POST   /api/bookings                    — Create
PUT    /api/bookings/:id                — Update
DELETE /api/bookings/:id                — Cancel
PATCH  /api/bookings/:id/status         — Change status
GET    /api/bookings/:id/invoice        — Generate invoice
POST   /api/bookings/:id/return         — Process return + condition check
GET    /api/bookings/check-availability — Check dates for equipment
```

**DB Table:** `bookings` (id, org_id, customer_id, equipment_id, assigned_user_id, start_date, end_date, pricing_type, fixed_rate, hourly_rate, hours_used, estimated_cost, actual_cost, security_deposit, status, notes, created_at)

---

### 4.8 BOOKING CALENDAR

**URL:** `/calendar`  
**Purpose:** Visual availability calendar per equipment

**Features:**
- Month / Week / Day view toggle
- Equipment filter (show one or all)
- Colour-coded events: Rental (blue) | Maintenance (orange) | Available (green) | Blocked (gray)
- Click event to see booking details
- Click empty slot to start new booking
- Drag to resize / move rental (if not started)
- Conflict detection — prevents double-booking

**APIs:**
```
GET /api/calendar/events               — All events for date range
GET /api/calendar/equipment/:id/slots  — Availability slots for one equipment
POST /api/calendar/block               — Block dates (no rental)
DELETE /api/calendar/block/:id         — Unblock
```

---

### 4.9 PENALTY MODULE

**URL:** `/penalties`  
**Purpose:** Track and collect charges for late returns and damage

**Penalty Types:**
- **Late Return** — auto-calculated: daily rate × overdue days
- **Damage** — manual entry with description and photos
- **Cleaning Fee** — fixed charge
- **Missing Items** — item-level charges

**Features:**
- Penalty list: Booking ID, Customer, Type, Amount, Status (Pending / Invoiced / Paid / Waived)
- Auto-create late return penalty when booking goes overdue (background job)
- Manual penalty creation with category and amount
- Penalty waiver with reason (manager permission required)
- Link penalty to invoice / payment

**APIs:**
```
GET    /api/penalties                  — List
GET    /api/penalties/:id              — Detail
POST   /api/penalties                  — Create manual penalty
PUT    /api/penalties/:id              — Update
PATCH  /api/penalties/:id/waive        — Waive with reason
PATCH  /api/penalties/:id/mark-paid    — Mark as paid
GET    /api/penalties/booking/:id      — Penalties for a booking
```

**DB Table:** `penalties` (id, org_id, booking_id, customer_id, type, amount, days_overdue, description, status, waived_by, waive_reason, paid_at, created_at)

---

### 4.10 MAINTENANCE MODULE

**URL:** `/maintenance`  
**Purpose:** Schedule and track equipment servicing

**Tabs:**
1. **Maintenance Schedule** — Upcoming and recurring maintenance
2. **Condition Reports** — Damage reports from users / customers
3. **Maintenance History** — Completed records

**Schedule Tab:**
- Table: Equipment, Type, Frequency, Next Due, Cost Estimate, Status
- Status: Scheduled | In Progress | Completed | Overdue | Skipped
- Frequency: One-time | Daily | Weekly | Monthly | Quarterly | Half-Yearly | Yearly
- Auto-calculate next due date on completion
- Send reminder N days before due date
- Skip a cycle with reason

**Condition Reports Tab:**
- Report: Equipment, Damage Level (None/Minor/Moderate/Severe), Description, Photos, Repair Required
- Link to maintenance record
- Status: Open | In Review | Resolved

**APIs:**
```
GET    /api/maintenance                      — List schedules
POST   /api/maintenance                      — Create schedule
PUT    /api/maintenance/:id                  — Update
DELETE /api/maintenance/:id                  — Delete
PATCH  /api/maintenance/:id/complete         — Mark complete, set next date
PATCH  /api/maintenance/:id/skip             — Skip with reason

GET    /api/maintenance/condition-reports    — List reports
POST   /api/maintenance/condition-reports    — Create report
PUT    /api/maintenance/condition-reports/:id — Update
```

**DB Tables:**
- `maintenance_schedules` (id, org_id, equipment_id, type, frequency, next_due_date, cost, status, notes)
- `condition_reports` (id, org_id, equipment_id, reported_by, damage_level, description, photos, repair_required, status, created_at)

---

### 4.11 REPORTS MODULE

**URL:** `/reports`  
**Tabs:** Overview | Revenue | Equipment Utilisation | Customers | Penalties | Maintenance Costs

**Overview Tab:**
- Revenue vs target this month
- Active vs total equipment
- Top 5 equipment by revenue
- Rentals by status pie chart

**Revenue Tab:**
- Monthly revenue bar chart (12 months)
- Revenue by pricing type (fixed vs hourly)
- Revenue by customer
- Revenue by equipment category
- Export to CSV / PDF

**Equipment Utilisation Tab:**
- Utilisation % per equipment (booked days / total days)
- Idle equipment list (not booked in 30 days)
- Equipment status distribution chart

**Customers Tab:**
- Top customers by spend
- Customer rental frequency
- New vs returning customers trend

**Penalties Tab:**
- Total penalties issued / collected / waived
- Overdue penalty list

**Maintenance Costs Tab:**
- Maintenance spend per equipment
- Preventive vs corrective breakdown

**APIs:**
```
GET /api/reports/overview            — Summary stats
GET /api/reports/revenue             — Revenue data (filterable by period)
GET /api/reports/utilisation         — Equipment utilisation
GET /api/reports/customers           — Customer analytics
GET /api/reports/penalties           — Penalty analytics
GET /api/reports/maintenance-costs   — Maintenance cost breakdown
GET /api/reports/export              — CSV export (query params: type, from, to)
```

---

### 4.12 USERS & ROLES MODULE

**URL:** `/users`  
**Purpose:** Manage who can access the organisation's panel and what they can do

**Roles:**

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access — all modules, settings, user management |
| **Manager** | All operational modules, cannot manage users or billing |
| **Operator** | View + create bookings and condition reports, cannot delete |
| **Viewer** | Read-only access to all modules |

**Features:**
- User list: Name, Email, Role, Status, Last Login
- Invite user by email (sends invite link)
- Assign/change role
- Deactivate / reactivate user
- Activity log per user

**APIs:**
```
GET    /api/users                   — List org users
POST   /api/users/invite            — Invite by email
GET    /api/users/:id               — User detail
PUT    /api/users/:id               — Update name/role
PATCH  /api/users/:id/deactivate    — Deactivate
GET    /api/users/:id/activity      — Activity log
```

**DB Table:** `org_users` (id, org_id, name, email, password_hash, role, status, last_login, invited_by, created_at)

---

### 4.13 SETTINGS MODULE

**URL:** `/settings`  
**Tabs:** Organisation Profile | Notifications | Security | Billing | Integrations

**Organisation Profile:**
- Name, Logo, Category, Address, Tax Number, Currency

**Notifications:**
- Email alerts: overdue rentals, upcoming maintenance, new bookings
- Webhook URL (for integrations)
- Notification frequency settings

**Security:**
- Change password
- Two-factor authentication (TOTP)
- Active sessions list + revoke
- API key management

**Billing:**
- Current plan details
- Usage (equipment count, user count)
- Upgrade / downgrade plan
- Invoice history
- Payment method (linked to Stripe)

**APIs:**
```
GET    /api/settings/profile         — Get org settings
PUT    /api/settings/profile         — Update
GET    /api/settings/notifications   — Get notification prefs
PUT    /api/settings/notifications   — Update
GET    /api/settings/billing         — Billing info + usage
PUT    /api/settings/security        — Change password
POST   /api/settings/api-keys        — Generate API key
DELETE /api/settings/api-keys/:id    — Revoke
```

---

## 5. SUPER ADMIN PANEL

**URL:** `/superadmin` (completely separate from org panel)  
**Access:** Platform owner only

### 5.1 Super Admin Dashboard
- Total organisations (active / inactive / trial)
- Total monthly recurring revenue (MRR)
- New signups this month
- Churned organisations this month
- System health status

### 5.2 Organisations Module
- List all organisations: Name, Plan, Status, Users, Equipment Count, Created Date
- View any org's full data (read-only)
- Activate / Suspend / Delete org
- Impersonate org (for support)

### 5.3 Subscription Management
- List all subscriptions with plan, status, billing dates
- **Manually create subscription** for an org (assign plan, set start/end date, mark as paid)
- Edit existing subscription (upgrade, extend, discount)
- Cancel / suspend subscription
- Apply custom pricing
- View invoice history per org

**APIs:**
```
GET    /api/superadmin/organisations             — All orgs
GET    /api/superadmin/organisations/:id         — Org detail
PATCH  /api/superadmin/organisations/:id/status  — Activate/suspend
POST   /api/superadmin/organisations/:id/impersonate — Impersonate

GET    /api/superadmin/subscriptions             — All subscriptions
POST   /api/superadmin/subscriptions             — Manually create
PUT    /api/superadmin/subscriptions/:id         — Update
PATCH  /api/superadmin/subscriptions/:id/cancel  — Cancel

GET    /api/superadmin/plans                     — Pricing plans
POST   /api/superadmin/plans                     — Create plan
PUT    /api/superadmin/plans/:id                 — Edit plan

GET    /api/superadmin/reports/revenue           — Platform MRR/ARR
GET    /api/superadmin/reports/usage             — Usage across all orgs
```

### 5.4 Super Admin DB Tables
- `organisations` (id, name, plan_id, status, owner_email, created_at)
- `plans` (id, name, price_monthly, price_yearly, max_equipment, max_users, features_json)
- `subscriptions` (id, org_id, plan_id, status, starts_at, ends_at, is_manual, created_by, created_at)
- `invoices` (id, org_id, subscription_id, amount, status, due_date, paid_at)

---

## 6. COMPLETE DATABASE SCHEMA OVERVIEW

```sql
-- Platform Level
organisations, plans, subscriptions, invoices

-- Auth
org_users, password_reset_tokens, refresh_tokens

-- Core Org Data
categories, equipment, customers, bookings, penalties
maintenance_schedules, condition_reports
calendar_blocks, notifications, activity_logs
```

---

## 7. NODE.JS / EXPRESS API ARCHITECTURE

```
server/
├── src/
│   ├── config/
│   │   ├── database.js          ← MySQL connection pool
│   │   └── jwt.js               ← JWT config
│   ├── middleware/
│   │   ├── auth.js              ← JWT verification
│   │   ├── orgScope.js          ← Inject org_id from token
│   │   ├── roleGuard.js         ← Role-based access control
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── equipment.routes.js
│   │   ├── categories.routes.js
│   │   ├── customers.routes.js
│   │   ├── bookings.routes.js
│   │   ├── penalties.routes.js
│   │   ├── maintenance.routes.js
│   │   ├── reports.routes.js
│   │   ├── users.routes.js
│   │   ├── settings.routes.js
│   │   └── superadmin.routes.js
│   ├── controllers/             ← One per route file
│   ├── services/                ← Business logic
│   ├── models/                  ← DB query functions
│   ├── jobs/
│   │   ├── overdueChecker.js    ← Auto-create late penalties
│   │   └── maintenanceReminder.js
│   └── app.js
├── migrations/                  ← SQL migration files
├── seeds/                       ← Sample data
├── .env
└── package.json
```

**Key packages:** express, mysql2, jsonwebtoken, bcryptjs, dotenv, cors, express-validator, node-cron, nodemailer, multer (image uploads)

---

## 8. NEXT.JS FRONTEND ARCHITECTURE

```
app/
├── (public)/
│   └── page.tsx                 ← Landing page
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (org)/
│   ├── layout.tsx               ← Org shell + sidebar
│   ├── dashboard/page.tsx
│   ├── categories/page.tsx
│   ├── equipment/
│   │   ├── page.tsx             ← List
│   │   └── [id]/page.tsx        ← Detail
│   ├── customers/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── bookings/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── calendar/page.tsx
│   ├── penalties/page.tsx
│   ├── maintenance/page.tsx
│   ├── reports/page.tsx
│   ├── users/page.tsx
│   └── settings/page.tsx
└── (superadmin)/
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── organisations/page.tsx
    ├── subscriptions/page.tsx
    └── reports/page.tsx

lib/
├── api.ts                       ← Axios instance with JWT interceptor
├── types.ts                     ← All TypeScript interfaces
├── auth-context.tsx             ← Auth state + login/logout
└── utils.ts

hooks/
├── useEquipment.ts              ← React Query hooks per module
├── useBookings.ts
└── ...
```

**Key packages to add:** axios, @tanstack/react-query, react-big-calendar (booking calendar)

---

## 9. ADDITIONAL RECOMMENDED FEATURES

Beyond what was requested, these features are strongly recommended for production quality:

1. **Email Notifications** — Booking confirmations, overdue alerts, maintenance reminders (via Nodemailer + SMTP)
2. **PDF Rental Agreement Generator** — Auto-generate professional PDF on booking creation
3. **Delivery / Logistics Module** — Track equipment pickup and delivery
4. **Equipment QR Code** — Each equipment gets a QR code; scan to view details / report damage
5. **Bulk Import** — CSV upload for bulk equipment or customer import
6. **Audit Log** — Every action logged with user + timestamp (who changed what)
7. **Multi-Currency Support** — Organisation sets its base currency in settings
8. **Tax Configuration** — Per-org tax rate, applied to invoices automatically
9. **Public Equipment Catalogue** — Optional public page per org showing available equipment
10. **Support Ticket System** — Customer raises ticket, org responds (already in mock data)

---

## 10. FEATURE STATUS (WHAT'S BUILT vs WHAT NEEDS BUILDING)

| Module | Frontend (Mock Data) | Backend API | DB Schema | Production Ready |
|--------|---------------------|-------------|-----------|-----------------|
| Landing Page | ✅ Partial | ❌ Need | ❌ Need | ❌ |
| Auth (Login/Register) | ✅ Mock only | ❌ Need | ❌ Need | ❌ |
| Dashboard | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Categories | ❌ Missing | ❌ Need | ❌ Need | ❌ |
| Equipment | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Customers | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Bookings / Rentals | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Booking Calendar | ✅ Mock events | ❌ Need | ❌ Need | ❌ |
| Penalties | ✅ Mock data | ❌ Need | ❌ Need | ❌ |
| Maintenance | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Reports | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Users & Roles | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Settings | ✅ Built | ❌ Need | ❌ Need | ❌ |
| Super Admin Panel | ❌ Missing | ❌ Need | ❌ Need | ❌ |
| Multi-tenancy (org_id scoping) | ❌ Not implemented | ❌ Need | ❌ Need | ❌ |
| Subscription Management | ❌ Missing | ❌ Need | ❌ Need | ❌ |

**Summary:** The frontend UI shell and components are largely built with mock data. The entire backend (Node.js + Express + MySQL) needs to be built from scratch, and the frontend needs to be connected to real APIs replacing all mock data.

---

## 11. RECOMMENDED BUILD ORDER

1. **Phase 1 — Backend Foundation**
   - DB schema + migrations (MySQL)
   - Auth APIs (register, login, JWT)
   - Org middleware (multi-tenancy scoping)
   - Equipment + Categories APIs

2. **Phase 2 — Core Operations**
   - Customers API
   - Bookings API + availability check
   - Penalties API + auto-overdue job
   - Maintenance API

3. **Phase 3 — Frontend API Integration**
   - Replace all mock data with real API calls (React Query)
   - Auth context → real JWT
   - Landing page + pricing from DB

4. **Phase 4 — Super Admin**
   - Super Admin panel (frontend + backend)
   - Subscription management
   - Org impersonation

5. **Phase 5 — Advanced Features**
   - Reports with real aggregations
   - Booking Calendar (react-big-calendar)
   - PDF generation
   - Email notifications
   - File uploads (images, documents)

---

*Document generated: June 7, 2026 | EquipTrack Pro v1.0*
