require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'equiptrack_pro',
  });

  console.log('🌱 Seeding database...');

  // Plans
  const starterPlanId = uuidv4();
  const proPlanId = uuidv4();
  const enterprisePlanId = uuidv4();

  await conn.execute('DELETE FROM subscriptions');
  await conn.execute('DELETE FROM users WHERE role != "superadmin"');
  await conn.execute('DELETE FROM organisations');
  await conn.execute('DELETE FROM plans');

  await conn.execute(
    `INSERT INTO plans (id, name, price_monthly, price_yearly, max_equipment, max_users, features) VALUES (?,?,?,?,?,?,?)`,
    [starterPlanId, 'Starter', 49.00, 470.00, 25, 3, JSON.stringify({ reports: 'basic', calendar: false, api: false, label: 'Perfect for small rental businesses' })]
  );
  await conn.execute(
    `INSERT INTO plans (id, name, price_monthly, price_yearly, max_equipment, max_users, features) VALUES (?,?,?,?,?,?,?)`,
    [proPlanId, 'Professional', 149.00, 1430.00, 200, 15, JSON.stringify({ reports: 'full', calendar: true, api: false, label: 'For growing rental operations' })]
  );
  await conn.execute(
    `INSERT INTO plans (id, name, price_monthly, price_yearly, max_equipment, max_users, features) VALUES (?,?,?,?,?,?,?)`,
    [enterprisePlanId, 'Enterprise', 349.00, 3350.00, 9999, 9999, JSON.stringify({ reports: 'full', calendar: true, api: true, label: 'For large enterprises & chains' })]
  );

  // Superadmin
  const superAdminId = uuidv4();
  const superHash = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123', 10);
  await conn.execute('DELETE FROM users WHERE role = "superadmin"');
  await conn.execute(
    `INSERT INTO users (id, org_id, name, email, password_hash, role, status) VALUES (?,NULL,?,?,?,'superadmin','active')`,
    [superAdminId, 'Super Admin', process.env.SUPERADMIN_EMAIL || 'superadmin@equiptrack.com', superHash]
  );

  // Demo organisation
  const orgId = uuidv4();
  await conn.execute(
    `INSERT INTO organisations (id, name, slug, category, email, phone, address, plan_id, status) VALUES (?,?,?,?,?,?,?,?,'active')`,
    [orgId, 'BuildRight Construction', 'buildright-demo', 'construction', 'admin@buildright.com', '+1-555-0100', '123 Construction Ave, Dallas TX 75001', proPlanId]
  );

  // Subscription
  const subId = uuidv4();
  await conn.execute(
    `INSERT INTO subscriptions (id, org_id, plan_id, status, billing_cycle, starts_at, ends_at, amount, is_manual) VALUES (?,?,?,'active','monthly',NOW(),DATE_ADD(NOW(), INTERVAL 1 MONTH),149.00,1)`,
    [subId, orgId, proPlanId]
  );

  // Admin user
  const adminId = uuidv4();
  const adminHash = await bcrypt.hash('Admin@123', 10);
  await conn.execute(
    `INSERT INTO users (id, org_id, name, email, password_hash, role, status) VALUES (?,?,?,?,?,'admin','active')`,
    [adminId, orgId, 'John Smith', 'admin@buildright.com', adminHash]
  );

  // Manager user
  const managerId = uuidv4();
  const managerHash = await bcrypt.hash('Manager@123', 10);
  await conn.execute(
    `INSERT INTO users (id, org_id, name, email, password_hash, role, status) VALUES (?,?,?,?,?,'manager','active')`,
    [managerId, orgId, 'Sarah Johnson', 'manager@buildright.com', managerHash]
  );

  // Categories
  const catEx = uuidv4(), catFk = uuidv4(), catTl = uuidv4(), catCr = uuidv4();
  // Insert categories using minimal columns to remain compatible with older schemas
  await conn.execute(`INSERT INTO categories (id,org_id,name) VALUES (?,?,?)`, [catEx, orgId, 'Excavators']);
  await conn.execute(`INSERT INTO categories (id,org_id,name) VALUES (?,?,?)`, [catFk, orgId, 'Forklifts']);
  await conn.execute(`INSERT INTO categories (id,org_id,name) VALUES (?,?,?)`, [catTl, orgId, 'Tools & Mixers']);
  await conn.execute(`INSERT INTO categories (id,org_id,name) VALUES (?,?,?)`, [catCr, orgId, 'Cranes']);

  // Equipment
  const eq1=uuidv4(), eq2=uuidv4(), eq3=uuidv4(), eq4=uuidv4();
  await conn.execute(
    `INSERT INTO equipment (id,org_id,category_id,name,description,serial_number,location,\`condition\`,status,pricing_type,fixed_rate,billing_period) VALUES (?,?,?,?,?,?,?,'good','available','fixed',450.00,'daily')`,
    [eq1,orgId,catEx,'Excavator CAT 320','Heavy duty excavator for digging and earthmoving','CAT320-001','Warehouse A']
  );
  await conn.execute(
    `INSERT INTO equipment (id,org_id,category_id,name,description,serial_number,location,\`condition\`,status,pricing_type,fixed_rate,billing_period) VALUES (?,?,?,?,?,?,?,'excellent','available','fixed',120.00,'daily')`,
    [eq2,orgId,catFk,'Forklift Toyota 5FGU45','Industrial forklift for material handling','TOY-FG-002','Warehouse B']
  );
  await conn.execute(
    `INSERT INTO equipment (id,org_id,category_id,name,description,serial_number,location,\`condition\`,status,pricing_type,fixed_rate,billing_period,hourly_rate) VALUES (?,?,?,?,?,?,?,'good','available','both',80.00,'daily',15.00)`,
    [eq3,orgId,catTl,'Concrete Mixer 450L','Portable concrete mixer','MIX-003','Warehouse A']
  );
  await conn.execute(
    `INSERT INTO equipment (id,org_id,category_id,name,description,serial_number,location,\`condition\`,status,pricing_type,fixed_rate,billing_period) VALUES (?,?,?,?,?,?,?,'good','available','fixed',850.00,'daily')`,
    [eq4,orgId,catCr,'Tower Crane Liebherr','Heavy lifting tower crane','LC-550-004','Job Site C']
  );

  // Customers
  const cust1=uuidv4(), cust2=uuidv4();
  // Customers: some schemas may lack a `type` column — attempt insert with type, fallback if needed
  try {
    await conn.execute(
      `INSERT INTO customers (id,org_id,name,type,email,phone,address) VALUES (?,?,'Pro Event Solutions','corporation','contact@proevents.com','+1-555-0102','456 Event Street, Houston TX')`,
      [cust1, orgId]
    );
  } catch (err) {
    await conn.execute(
      `INSERT INTO customers (id,org_id,name,email,phone,address) VALUES (?,?,?,?,?,?)`,
      [cust1, orgId, 'Pro Event Solutions', 'contact@proevents.com', '+1-555-0102', '456 Event Street, Houston TX']
    );
  }

  try {
    await conn.execute(
      `INSERT INTO customers (id,org_id,name,type,email,phone,address) VALUES (?,?,'Metro Builders LLC','small_business','info@metrobuilders.com','+1-555-0103','789 Metro Ave, Austin TX')`,
      [cust2, orgId]
    );
  } catch (err) {
    await conn.execute(
      `INSERT INTO customers (id,org_id,name,email,phone,address) VALUES (?,?,?,?,?,?)`,
      [cust2, orgId, 'Metro Builders LLC', 'info@metrobuilders.com', '+1-555-0103', '789 Metro Ave, Austin TX']
    );
  }

  // Bookings
  const bk1=uuidv4(), bk2=uuidv4();
  await conn.execute(
    `INSERT INTO bookings (id,org_id,customer_id,equipment_id,assigned_user_id,start_date,end_date,pricing_type,fixed_rate,estimated_cost,actual_cost,status) VALUES (?,?,?,?,?,DATE_SUB(CURDATE(),INTERVAL 10 DAY),DATE_SUB(CURDATE(),INTERVAL 3 DAY),'fixed',450.00,3150.00,3150.00,'completed')`,
    [bk1,orgId,cust1,eq1,adminId]
  );
  await conn.execute(
    `INSERT INTO bookings (id,org_id,customer_id,equipment_id,assigned_user_id,start_date,end_date,pricing_type,fixed_rate,estimated_cost,status) VALUES (?,?,?,?,?,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 7 DAY),'fixed',120.00,840.00,'active')`,
    [bk2,orgId,cust2,eq2,managerId]
  );

  // Maintenance
  // Maintenance schedules: fallback if `type` column missing
  try {
    await conn.execute(
      `INSERT INTO maintenance_schedules (id,org_id,equipment_id,type,frequency,scheduled_date,description,cost,status) VALUES (?,?,?,'preventive','monthly',DATE_ADD(CURDATE(),INTERVAL 5 DAY),'Regular oil change and filter replacement',250.00,'scheduled')`,
      [uuidv4(),orgId,eq1]
    );
  } catch (err) {
    await conn.execute(
      `INSERT INTO maintenance_schedules (id,org_id,equipment_id,frequency,scheduled_date,description,cost,status) VALUES (?,?,?,'monthly',DATE_ADD(CURDATE(),INTERVAL 5 DAY),'Regular oil change and filter replacement',250.00,'scheduled')`,
      [uuidv4(),orgId,eq1]
    );
  }

  try {
    await conn.execute(
      `INSERT INTO maintenance_schedules (id,org_id,equipment_id,type,frequency,scheduled_date,description,cost,status) VALUES (?,?,?,'inspection','quarterly',DATE_ADD(CURDATE(),INTERVAL 15 DAY),'Quarterly safety inspection',100.00,'scheduled')`,
      [uuidv4(),orgId,eq2]
    );
  } catch (err) {
    await conn.execute(
      `INSERT INTO maintenance_schedules (id,org_id,equipment_id,frequency,scheduled_date,description,cost,status) VALUES (?,?,?,'quarterly',DATE_ADD(CURDATE(),INTERVAL 15 DAY),'Quarterly safety inspection',100.00,'scheduled')`,
      [uuidv4(),orgId,eq2]
    );
  }

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Demo Login Accounts:');
  console.log('  🔴 Super Admin : superadmin@equiptrack.com / SuperAdmin@123');
  console.log('  🟢 Org Admin   : admin@buildright.com     / Admin@123');
  console.log('  🔵 Org Manager : manager@buildright.com   / Manager@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await conn.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
