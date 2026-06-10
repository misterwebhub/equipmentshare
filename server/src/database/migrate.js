require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const migrations = [
  `CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_equipment INT DEFAULT 25,
    max_users INT DEFAULT 3,
    features JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS organisations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(100) DEFAULT 'construction',
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(500),
    tax_number VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    plan_id VARCHAR(36),
    status ENUM('active','inactive','suspended','trial') DEFAULT 'trial',
    trial_ends_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NOT NULL,
    status ENUM('active','cancelled','expired','trial','past_due') DEFAULT 'trial',
    billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
    starts_at DATETIME NOT NULL,
    ends_at DATETIME,
    amount DECIMAL(10,2) DEFAULT 0,
    is_manual TINYINT(1) DEFAULT 0,
    notes TEXT,
    created_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin','admin','manager','operator','viewer') DEFAULT 'operator',
    status ENUM('active','inactive','invited') DEFAULT 'active',
    last_login DATETIME,
    invited_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(36),
    icon VARCHAR(50) DEFAULT 'Package',
    color VARCHAR(20) DEFAULT '#3b82f6',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    serial_number VARCHAR(100),
    location VARCHAR(255),
    \`condition\` ENUM('excellent','good','fair','poor') DEFAULT 'good',
    status ENUM('available','in-use','rented-out','maintenance','damaged') DEFAULT 'available',
    pricing_type ENUM('fixed','hourly','both') DEFAULT 'fixed',
    fixed_rate DECIMAL(10,2) DEFAULT 0,
    billing_period ENUM('daily','weekly','monthly') DEFAULT 'daily',
    hourly_rate DECIMAL(10,2),
    min_rental_days INT DEFAULT 1,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    certifications JSON,
    specifications JSON,
    images JSON,
    assigned_user_id VARCHAR(36),
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS equipment_units (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    sku_code VARCHAR(100) NOT NULL,
    status ENUM('available','rented-out','maintenance','damaged','retired') DEFAULT 'available',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_sku_org (org_id, sku_code),
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('individual','small_business','corporation','government') DEFAULT 'small_business',
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_number VARCHAR(100),
    notes TEXT,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    equipment_unit_id VARCHAR(36),
    assigned_user_id VARCHAR(36),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pricing_type ENUM('fixed','hourly') DEFAULT 'fixed',
    fixed_rate DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    hours_used DECIMAL(10,2),
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2),
    security_deposit DECIMAL(10,2) DEFAULT 0,
    deposit_returned TINYINT(1) DEFAULT 0,
    status ENUM('pending','active','completed','overdue','cancelled') DEFAULT 'pending',
    notes TEXT,
    returned_at DATETIME,
    return_condition ENUM('excellent','good','fair','poor'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  )`,

  `CREATE TABLE IF NOT EXISTS booking_items (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    equipment_unit_id VARCHAR(36),
    description VARCHAR(255),
    pricing_type ENUM('fixed','daily','weekly','monthly','hourly') DEFAULT 'daily',
    unit_rate DECIMAL(10,2) DEFAULT 0,
    quantity DECIMAL(10,2) DEFAULT 1,
    line_total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  )`,

  `CREATE TABLE IF NOT EXISTS penalties (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    type ENUM('late_return','damage','cleaning','missing_items','other') DEFAULT 'other',
    amount DECIMAL(10,2) NOT NULL,
    days_overdue INT DEFAULT 0,
    description TEXT,
    status ENUM('pending','invoiced','paid','waived') DEFAULT 'pending',
    waived_by VARCHAR(36),
    waive_reason TEXT,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`,

  `CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    type ENUM('preventive','corrective','inspection') DEFAULT 'preventive',
    frequency ENUM('one-time','daily','weekly','monthly','quarterly','half-yearly','yearly') DEFAULT 'monthly',
    scheduled_date DATE NOT NULL,
    next_due_date DATE,
    completed_date DATE,
    description TEXT,
    cost DECIMAL(10,2) DEFAULT 0,
    status ENUM('scheduled','in-progress','completed','overdue','skipped') DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS condition_reports (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),
    reported_by VARCHAR(36),
    damage_level ENUM('none','minor','moderate','severe') DEFAULT 'none',
    description TEXT,
    photos JSON,
    repair_required TINYINT(1) DEFAULT 0,
    status ENUM('open','in_review','resolved') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  )`,

  `CREATE TABLE IF NOT EXISTS calendar_blocks (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    reason VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  )`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36),
    user_id VARCHAR(36),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36),
    assigned_to VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('equipment','booking','billing','technical','other') DEFAULT 'other',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS ticket_comments (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
  )`,
];

async function runMigrations() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
  });

  // `execute` uses the prepared statement protocol which doesn't support
  // certain commands (CREATE DATABASE / USE). Use `query` for those.
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'equiptrack_pro'}\``);
  await conn.query(`USE \`${process.env.DB_NAME || 'equiptrack_pro'}\``);

  console.log('Running migrations...');
  for (const sql of migrations) {
    const match = sql.match(/CREATE TABLE IF NOT EXISTS [`]?(\w+)[`]?/);
    const tableName = match ? match[1] : 'unknown';
    try {
      await conn.execute(sql);
      console.log(`  OK: ${tableName}`);
    } catch (err) {
      console.error(`  FAIL ${tableName}:`, err.message);
    }
  }

  // ── Column patches (ALTER TABLE ADD COLUMN IF NOT EXISTS workaround) ──
  // MySQL < 8.0 doesn't support IF NOT EXISTS on ALTER TABLE ADD COLUMN.
  // We catch ER_DUP_FIELDNAME (1060) and treat it as success.
  const columnPatches = [
    ['booking_items', 'unit_ids', 'ALTER TABLE booking_items ADD COLUMN unit_ids JSON NULL'],
    ['bookings', 'is_quotation', 'ALTER TABLE bookings ADD COLUMN is_quotation TINYINT(1) DEFAULT 0 AFTER status'],
    ['bookings', 'quotation_expires_at', 'ALTER TABLE bookings ADD COLUMN quotation_expires_at DATE NULL'],
    ['condition_reports', 'equipment_unit_id', 'ALTER TABLE condition_reports ADD COLUMN equipment_unit_id VARCHAR(36) NULL'],
    ['condition_reports', 'repair_cost', 'ALTER TABLE condition_reports ADD COLUMN repair_cost DECIMAL(10,2) DEFAULT 0'],
    ['condition_reports', 'resolved_at', 'ALTER TABLE condition_reports ADD COLUMN resolved_at DATETIME NULL'],
    ['bookings', 'equipment_unit_id', 'ALTER TABLE bookings ADD COLUMN equipment_unit_id VARCHAR(36) NULL AFTER equipment_id'],
    ['bookings', 'deposit_returned',  'ALTER TABLE bookings ADD COLUMN deposit_returned TINYINT(1) DEFAULT 0'],
    ['bookings', 'return_condition',  "ALTER TABLE bookings ADD COLUMN return_condition ENUM('excellent','good','fair','poor') NULL"],
    ['bookings', 'invoice_number',    "ALTER TABLE bookings ADD COLUMN invoice_number VARCHAR(50) NULL"],
    ['bookings', 'discount',          "ALTER TABLE bookings ADD COLUMN discount DECIMAL(10,2) DEFAULT 0"],
    ['bookings', 'tax_rate',          "ALTER TABLE bookings ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0"],
  ];

  console.log('\nApplying column patches...');
  for (const [table, col, sql] of columnPatches) {
    try {
      await conn.execute(sql);
      console.log(`  ADDED: ${table}.${col}`);
    } catch (err) {
      if (err.errno === 1060) console.log(`  EXISTS: ${table}.${col}`);
      else console.error(`  FAIL ${table}.${col}:`, err.message);
    }
  }

  console.log('\nAll migrations complete!');
  await conn.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
