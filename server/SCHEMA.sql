-- EquipTrack Pro — MySQL schema (production target)
-- The in-memory store in src/store.js mirrors these tables 1:1. To go live,
-- replace the store helpers (list/find/insert/update/remove) with queries
-- against these tables; route handlers stay unchanged.

CREATE TABLE organizations (
  id          VARCHAR(40) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(200) NOT NULL UNIQUE,
  category    VARCHAR(40),
  email       VARCHAR(200),
  phone       VARCHAR(40),
  address     VARCHAR(400),
  status      ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
  id              VARCHAR(40) PRIMARY KEY,
  name            VARCHAR(80) NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  `interval`      ENUM('month','year') DEFAULT 'month',
  equipment_limit INT DEFAULT -1,
  user_limit      INT DEFAULT -1,
  features        JSON
);

CREATE TABLE subscriptions (
  id                 VARCHAR(40) PRIMARY KEY,
  org_id             VARCHAR(40) NOT NULL,
  plan_id            VARCHAR(40),
  status             ENUM('pending','trialing','active','past_due','cancelled') DEFAULT 'pending',
  started_at         DATETIME,
  current_period_end DATETIME,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE users (
  id            VARCHAR(40) PRIMARY KEY,
  org_id        VARCHAR(40),               -- NULL for super admin
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role          ENUM('superadmin','admin','manager','operator','viewer') NOT NULL,
  status        ENUM('active','inactive') DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE companies (    -- customers / partner companies
  id          VARCHAR(40) PRIMARY KEY,
  org_id      VARCHAR(40) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(40),
  email       VARCHAR(200),
  phone       VARCHAR(40),
  address     VARCHAR(400),
  can_rent    BOOLEAN DEFAULT TRUE,
  can_provide BOOLEAN DEFAULT FALSE,
  status      ENUM('active','inactive') DEFAULT 'active',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE equipment (
  id              VARCHAR(40) PRIMARY KEY,
  org_id          VARCHAR(40) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  category        VARCHAR(80),
  status          ENUM('available','in-use','rented-out','maintenance','damaged') DEFAULT 'available',
  pricing_type    ENUM('fixed','hourly','both') DEFAULT 'fixed',
  fixed_rate      DECIMAL(10,2),
  hourly_rate     DECIMAL(10,2),
  location        VARCHAR(200),
  condition_state ENUM('excellent','good','fair','poor') DEFAULT 'good',
  specifications  JSON,
  certifications  JSON,
  last_maintenance DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE rentals (
  id            VARCHAR(40) PRIMARY KEY,
  org_id        VARCHAR(40) NOT NULL,
  customer_id   VARCHAR(40),
  equipment_ids JSON,
  person_id     VARCHAR(40),
  project_id    VARCHAR(40),
  start_date    DATETIME,
  end_date      DATETIME,
  pricing_model ENUM('fixed','hourly') DEFAULT 'fixed',
  estimated_cost DECIMAL(10,2),
  actual_cost    DECIMAL(10,2),
  hours_used     DECIMAL(10,2),
  status        ENUM('pending','active','completed','overdue','cancelled') DEFAULT 'pending',
  notes         TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- maintenance, condition_reports, deliveries, notifications, penalties,
-- tickets, projects, calendar_events follow the same org_id-scoped pattern.
