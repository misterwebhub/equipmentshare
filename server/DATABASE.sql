-- ============================================================
--  EquipTrack Pro — Production MySQL Schema
--  Run once against a fresh database:
--    mysql -u root -p equiptrack_pro < DATABASE.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  PLANS  (defined before organisations so FK works)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id             VARCHAR(40)    PRIMARY KEY,
  name           VARCHAR(80)    NOT NULL,
  price_monthly  DECIMAL(10,2)  NOT NULL DEFAULT 0,
  price_yearly   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  max_equipment  INT            NOT NULL DEFAULT 25,
  max_users      INT            NOT NULL DEFAULT 3,
  features       JSON,
  is_active      TINYINT(1)     NOT NULL DEFAULT 1,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  ORGANISATIONS  (one row per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS organisations (
  id              VARCHAR(40)   PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  slug            VARCHAR(200)  NOT NULL UNIQUE,
  category        VARCHAR(60)   NOT NULL DEFAULT 'construction',
  email           VARCHAR(200),
  phone           VARCHAR(40),
  address         VARCHAR(400),
  logo_url        VARCHAR(400),
  currency        VARCHAR(10)   NOT NULL DEFAULT 'USD',
  plan_id         VARCHAR(40),
  status          ENUM('active','trial','suspended') NOT NULL DEFAULT 'trial',
  trial_ends_at   DATETIME,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL
);

-- ============================================================
--  USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             VARCHAR(40)   PRIMARY KEY,
  org_id         VARCHAR(40),                   -- NULL for superadmin
  name           VARCHAR(200)  NOT NULL,
  email          VARCHAR(200)  NOT NULL UNIQUE,
  password_hash  VARCHAR(200)  NOT NULL,
  role           ENUM('superadmin','admin','manager','operator','viewer') NOT NULL DEFAULT 'operator',
  status         ENUM('active','inactive')       NOT NULL DEFAULT 'active',
  last_login     DATETIME,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organisations (id) ON DELETE CASCADE
);

-- ============================================================
--  REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR(40)  PRIMARY KEY,
  user_id     VARCHAR(40)  NOT NULL,
  token       TEXT         NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ============================================================
--  SUBSCRIPTIONS  (manual or payment-gateway)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id             VARCHAR(40)   PRIMARY KEY,
  org_id         VARCHAR(40)   NOT NULL,
  plan_id        VARCHAR(40)   NOT NULL,
  status         ENUM('active','trial','cancelled','expired') NOT NULL DEFAULT 'active',
  billing_cycle  ENUM('monthly','yearly')  NOT NULL DEFAULT 'monthly',
  starts_at      DATETIME      NOT NULL,
  ends_at        DATETIME,
  amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  is_manual      TINYINT(1)    NOT NULL DEFAULT 0,
  created_by     VARCHAR(40),                   -- superadmin user_id for manual subs
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)     REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id)    REFERENCES plans (id),
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- ============================================================
--  CATEGORIES  (per-org equipment categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id           VARCHAR(40)   PRIMARY KEY,
  org_id       VARCHAR(40)   NOT NULL,
  name         VARCHAR(100)  NOT NULL,
  description  TEXT,
  color        VARCHAR(20)   NOT NULL DEFAULT '#3b82f6',
  deleted_at   DATETIME,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organisations (id) ON DELETE CASCADE
);

-- ============================================================
--  EQUIPMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
  id                VARCHAR(40)   PRIMARY KEY,
  org_id            VARCHAR(40)   NOT NULL,
  category_id       VARCHAR(40),
  assigned_user_id  VARCHAR(40),
  name              VARCHAR(200)  NOT NULL,
  description       TEXT,
  serial_number     VARCHAR(100),
  location          VARCHAR(200),
  `condition`       ENUM('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
  status            ENUM('available','rented-out','maintenance','damaged','retired') NOT NULL DEFAULT 'available',
  pricing_type      ENUM('fixed','hourly','both')  NOT NULL DEFAULT 'fixed',
  billing_period    ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  fixed_rate        DECIMAL(10,2) NOT NULL DEFAULT 0,
  hourly_rate       DECIMAL(10,2),
  min_rental_days   INT           NOT NULL DEFAULT 1,
  security_deposit  DECIMAL(10,2) NOT NULL DEFAULT 0,
  purchase_date     DATE,
  purchase_price    DECIMAL(10,2),
  certifications    JSON,
  specifications    JSON,
  deleted_at        DATETIME,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)           REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (category_id)      REFERENCES categories   (id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_user_id) REFERENCES users        (id) ON DELETE SET NULL
);

-- ============================================================
--  CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id          VARCHAR(40)   PRIMARY KEY,
  org_id      VARCHAR(40)   NOT NULL,
  name        VARCHAR(200)  NOT NULL,
  email       VARCHAR(200),
  phone       VARCHAR(40),
  address     VARCHAR(400),
  notes       TEXT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organisations (id) ON DELETE CASCADE
);

-- ============================================================
--  BOOKINGS  (one equipment per booking row)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id                VARCHAR(40)   PRIMARY KEY,
  org_id            VARCHAR(40)   NOT NULL,
  customer_id       VARCHAR(40)   NOT NULL,
  equipment_id      VARCHAR(40)   NOT NULL,
  assigned_user_id  VARCHAR(40),
  start_date        DATE          NOT NULL,
  end_date          DATE          NOT NULL,
  pricing_type      ENUM('fixed','hourly')  NOT NULL DEFAULT 'fixed',
  billing_period    ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  fixed_rate        DECIMAL(10,2) NOT NULL DEFAULT 0,
  hourly_rate       DECIMAL(10,2),
  hours_used        DECIMAL(10,2),
  estimated_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cost       DECIMAL(10,2),
  security_deposit  DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  status            ENUM('pending','active','completed','overdue','cancelled') NOT NULL DEFAULT 'pending',
  returned_at       DATETIME,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)           REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id)      REFERENCES customers    (id),
  FOREIGN KEY (equipment_id)     REFERENCES equipment    (id),
  FOREIGN KEY (assigned_user_id) REFERENCES users        (id) ON DELETE SET NULL
);

-- ============================================================
--  PENALTIES  (late returns, damage, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS penalties (
  id            VARCHAR(40)   PRIMARY KEY,
  org_id        VARCHAR(40)   NOT NULL,
  booking_id    VARCHAR(40),
  customer_id   VARCHAR(40),
  type          ENUM('late_return','damage','other') NOT NULL DEFAULT 'other',
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  days_overdue  INT           NOT NULL DEFAULT 0,
  description   TEXT,
  status        ENUM('pending','paid','waived')  NOT NULL DEFAULT 'pending',
  waived_by     VARCHAR(40),
  waived_reason TEXT,
  paid_at       DATETIME,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)     REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings     (id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id)REFERENCES customers    (id) ON DELETE SET NULL,
  FOREIGN KEY (waived_by)  REFERENCES users        (id) ON DELETE SET NULL
);

-- ============================================================
--  MAINTENANCE SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id               VARCHAR(40)   PRIMARY KEY,
  org_id           VARCHAR(40)   NOT NULL,
  equipment_id     VARCHAR(40)   NOT NULL,
  type             ENUM('preventive','corrective','inspection','calibration') NOT NULL DEFAULT 'preventive',
  frequency        ENUM('weekly','monthly','quarterly','yearly','one-time')   NOT NULL DEFAULT 'monthly',
  status           ENUM('scheduled','in_progress','completed','cancelled')    NOT NULL DEFAULT 'scheduled',
  scheduled_date   DATE,
  completed_date   DATE,
  description      TEXT,
  notes            TEXT,
  cost             DECIMAL(10,2) NOT NULL DEFAULT 0,
  technician       VARCHAR(200),
  next_due_date    DATE,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)       REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment    (id) ON DELETE CASCADE
);

-- ============================================================
--  CONDITION REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS condition_reports (
  id               VARCHAR(40)   PRIMARY KEY,
  org_id           VARCHAR(40)   NOT NULL,
  equipment_id     VARCHAR(40)   NOT NULL,
  booking_id       VARCHAR(40),
  reported_by      VARCHAR(40),
  `condition`      ENUM('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
  damage_level     ENUM('none','minor','moderate','severe')                   NOT NULL DEFAULT 'none',
  description      TEXT,
  notes            TEXT,
  images           JSON,
  repair_required  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)        REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id)  REFERENCES equipment    (id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id)    REFERENCES bookings     (id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by)   REFERENCES users        (id) ON DELETE SET NULL
);

-- ============================================================
--  CALENDAR BLOCKS  (manually blocked dates per equipment)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id            VARCHAR(40)   PRIMARY KEY,
  org_id        VARCHAR(40)   NOT NULL,
  equipment_id  VARCHAR(40),               -- NULL = block all equipment
  start_date    DATE          NOT NULL,
  end_date      DATE          NOT NULL,
  reason        VARCHAR(400),
  created_by    VARCHAR(40),
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id)       REFERENCES organisations (id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment    (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)   REFERENCES users        (id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  SEED: Default plans
-- ============================================================
INSERT IGNORE INTO plans (id, name, price_monthly, price_yearly, max_equipment, max_users, features, is_active) VALUES
  ('plan-starter',      'Starter',      29,   290,   25,   3,  '{"reports":false,"api":false}', 1),
  ('plan-professional', 'Professional', 79,   790,   100,  10, '{"reports":true,"api":false}',  1),
  ('plan-enterprise',   'Enterprise',   199,  1990,  999,  50, '{"reports":true,"api":true}',   1);

-- ============================================================
--  SEED: Superadmin user
--  Email: admin@equiptrackpro.com
--  Password: Admin@123   (bcrypt hash below — change in prod!)
-- ============================================================
INSERT IGNORE INTO users (id, org_id, name, email, password_hash, role, status) VALUES
  ('user-superadmin', NULL, 'Super Admin', 'admin@equiptrackpro.com',
   '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KMjaom', -- Admin@123
   'superadmin', 'active');
