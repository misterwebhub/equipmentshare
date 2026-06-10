'use strict';
/**
 * Demo Seed Controller
 * POST /api/settings/demo-seed
 *
 * Admin-only endpoint that:
 *   1. Wipes all operational data for the current org (keeps users + org row itself).
 *   2. Inserts a rich set of realistic demo data so the whole app is populated.
 */

const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

/* ── helpers ────────────────────────────────────────────────────── */
const d = (offsetDays = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
};
const dt = (offsetDays = 0, h = 10) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  x.setHours(h, 0, 0, 0);
  return x.toISOString().replace('T', ' ').slice(0, 19);
};

/* ── main handler ─────────────────────────────────────────────────── */
async function resetAndSeed(req, res) {
  const orgId = req.orgId;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    /* ── 1. Wipe all org data (FK-safe order) ── */
    const tables = [
      'notifications',
      'activity_logs',
      'support_tickets',
      'condition_reports',
      'maintenance_schedules',
      'penalties',
      'booking_items',
      'bookings',
      'equipment_units',
      'equipment',
      'customers',
      'categories',
    ];
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) {
      await conn.execute(`DELETE FROM ${t} WHERE org_id = ?`, [orgId]);
    }
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    /* ── 2. Categories ── */
    const cats = [
      { id: uuidv4(), name: 'Excavators',      icon: 'Shovel',   color: '#f59e0b' },
      { id: uuidv4(), name: 'Cranes & Hoists',  icon: 'ArrowUp',  color: '#3b82f6' },
      { id: uuidv4(), name: 'Compressors',       icon: 'Wind',     color: '#10b981' },
      { id: uuidv4(), name: 'Generators',        icon: 'Zap',      color: '#8b5cf6' },
      { id: uuidv4(), name: 'Forklifts',         icon: 'Truck',    color: '#ef4444' },
      { id: uuidv4(), name: 'Scaffolding',       icon: 'Layers',   color: '#f97316' },
    ];
    for (const c of cats) {
      await conn.execute(
        `INSERT INTO categories (id, org_id, name, icon, color) VALUES (?,?,?,?,?)`,
        [c.id, orgId, c.name, c.icon, c.color]
      );
    }
    const [catEx, catCr, catCo, catGe, catFo, catSc] = cats;

    /* ── 3. Equipment ── */
    const equip = [
      { id: uuidv4(), cat: catEx.id, name: 'Komatsu PC210 Excavator',  serial: 'KPC-210-001', loc: 'Yard A',  cond: 'excellent', pricing_type: 'daily',   fixed_rate: 450, billing_period: 'daily',   desc: '21-ton hydraulic excavator with GPS tracking' },
      { id: uuidv4(), cat: catEx.id, name: 'CAT 320 Excavator',         serial: 'CAT-320-002', loc: 'Yard A',  cond: 'good',      pricing_type: 'daily',   fixed_rate: 500, billing_period: 'daily',   desc: '20-ton Cat excavator, blade attachment included' },
      { id: uuidv4(), cat: catCr.id, name: 'Liebherr 180-ton Crane',    serial: 'LBH-180-001', loc: 'Yard B',  cond: 'excellent', pricing_type: 'daily',   fixed_rate: 1200, billing_period: 'daily',  desc: 'Mobile crane, max reach 60m' },
      { id: uuidv4(), cat: catCr.id, name: '10-ton Chain Hoist',        serial: 'CH-010-003',  loc: 'Store 1', cond: 'good',      pricing_type: 'fixed',   fixed_rate: 180,  billing_period: 'daily',  desc: 'Electric chain hoist, 6m lift height' },
      { id: uuidv4(), cat: catCo.id, name: 'Atlas Copco XAS 375 Air Compressor', serial: 'ACA-375-001', loc: 'Yard C', cond: 'good', pricing_type: 'daily', fixed_rate: 220, billing_period: 'daily', desc: '375 CFM diesel compressor' },
      { id: uuidv4(), cat: catCo.id, name: 'Ingersoll-Rand 185 CFM',   serial: 'IR-185-002',  loc: 'Yard C',  cond: 'fair',      pricing_type: 'daily',   fixed_rate: 160, billing_period: 'daily',   desc: 'Portable air compressor, 185 CFM' },
      { id: uuidv4(), cat: catGe.id, name: 'Caterpillar DE275E Generator', serial: 'CAT-GEN-275', loc: 'Yard D', cond: 'excellent', pricing_type: 'daily', fixed_rate: 350, billing_period: 'daily', desc: '275 kVA standby generator' },
      { id: uuidv4(), cat: catGe.id, name: '60 kVA Diesel Generator',   serial: 'GEN-060-005', loc: 'Store 2', cond: 'good',      pricing_type: 'daily',   fixed_rate: 150, billing_period: 'daily',   desc: 'Compact 60 kVA generator for site power' },
      { id: uuidv4(), cat: catFo.id, name: 'Toyota 8FBN25 Electric Forklift', serial: 'TOY-FBN-001', loc: 'Warehouse', cond: 'excellent', pricing_type: 'daily', fixed_rate: 280, billing_period: 'daily', desc: '2.5-ton electric counterbalance forklift' },
      { id: uuidv4(), cat: catFo.id, name: 'Crown SC 6000 Reach Truck', serial: 'CRN-SC-002', loc: 'Warehouse', cond: 'good', pricing_type: 'daily', fixed_rate: 240, billing_period: 'daily', desc: '2.0-ton reach truck, 12.5m lift' },
      { id: uuidv4(), cat: catSc.id, name: 'Ring-lock Scaffolding System', serial: 'SCF-RL-100', loc: 'Yard E', cond: 'good', pricing_type: 'weekly', fixed_rate: 800, billing_period: 'weekly', desc: 'Complete 100m² modular scaffolding set' },
      { id: uuidv4(), cat: catSc.id, name: 'Mobile Scaffold Tower 8m',   serial: 'SCF-MT-008', loc: 'Store 1', cond: 'good', pricing_type: 'daily', fixed_rate: 65, billing_period: 'daily', desc: 'Aluminium mobile tower scaffold, 8m working height' },
    ];
    for (const e of equip) {
      await conn.execute(
        `INSERT INTO equipment
          (id, org_id, category_id, name, description, serial_number, location,
           \`condition\`, status, pricing_type, fixed_rate, billing_period, min_rental_days, security_deposit)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [e.id, orgId, e.cat, e.name, e.desc, e.serial, e.loc,
         e.cond, 'available', e.pricing_type, e.fixed_rate, e.billing_period, 1, e.fixed_rate * 2]
      );
    }

    /* ── 4. Equipment Units (SKUs) ── */
    const unitRows = [];
    const skuMap = {}; // equipId → [unitId,…]

    const addUnits = (equipId, prefix, count, statuses) => {
      skuMap[equipId] = [];
      for (let i = 1; i <= count; i++) {
        const uid = uuidv4();
        const status = statuses[i - 1] || 'available';
        unitRows.push([uid, orgId, equipId, `${prefix}-${String(i).padStart(3,'0')}`, status]);
        skuMap[equipId].push({ id: uid, status });
      }
    };

    addUnits(equip[0].id,  'KPC210', 2, ['available','rented-out']);
    addUnits(equip[1].id,  'CAT320', 2, ['available','maintenance']);
    addUnits(equip[2].id,  'LBH180', 1, ['available']);
    addUnits(equip[3].id,  'CH010',  3, ['available','available','rented-out']);
    addUnits(equip[4].id,  'ACA375', 2, ['available','available']);
    addUnits(equip[5].id,  'IR185',  2, ['rented-out','available']);
    addUnits(equip[6].id,  'CATGEN275',2,['available','rented-out']);
    addUnits(equip[7].id,  'GEN060', 3, ['available','available','available']);
    addUnits(equip[8].id,  'TOYFBN', 2, ['available','available']);
    addUnits(equip[9].id,  'CRNSC',  1, ['available']);
    addUnits(equip[10].id, 'SCFRL',  4, ['available','available','rented-out','available']);
    addUnits(equip[11].id, 'SCFMT',  3, ['available','available','rented-out']);

    for (const u of unitRows) {
      await conn.execute(
        `INSERT INTO equipment_units (id, org_id, equipment_id, sku_code, status) VALUES (?,?,?,?,?)`,
        u
      );
    }

    /* ── 5. Customers ── */
    const customers = [
      { id: uuidv4(), name: 'Apex Contractors Ltd',      type: 'corporation',   email: 'ops@apexcontractors.com',   phone: '+1-555-0201', address: '45 Industrial Park, Houston TX', notes: 'Preferred customer — 3yr relationship' },
      { id: uuidv4(), name: 'SkyScrape Developments',    type: 'corporation',   email: 'hire@skyscrape.com',         phone: '+1-555-0202', address: '1200 Tower Blvd, Dallas TX', notes: 'High volume, 30-day payment terms' },
      { id: uuidv4(), name: 'FastBuild LLC',             type: 'small_business',email: 'admin@fastbuild.com',        phone: '+1-555-0203', address: '78 Commerce St, Austin TX', notes: '' },
      { id: uuidv4(), name: 'Metro City Council',        type: 'government',    email: 'procurement@metrocity.gov', phone: '+1-555-0204', address: 'City Hall, 1 Main St, San Antonio TX', notes: 'Government PO required before dispatch' },
      { id: uuidv4(), name: 'PeakRise Engineering',     type: 'corporation',   email: 'rentals@peakrise.com',       phone: '+1-555-0205', address: '300 Engineer Way, Fort Worth TX', notes: '' },
      { id: uuidv4(), name: 'James Harrington',          type: 'individual',    email: 'j.harrington@email.com',    phone: '+1-555-0206', address: '92 Oak Lane, Plano TX', notes: 'Residential project' },
      { id: uuidv4(), name: 'SolarBuild Group',          type: 'small_business',email: 'hire@solarbuild.net',        phone: '+1-555-0207', address: '5 Solar Park, Frisco TX', notes: 'Solar farm construction, seasonal hires' },
      { id: uuidv4(), name: 'DrillMaster Services',      type: 'small_business',email: 'info@drillmaster.com',       phone: '+1-555-0208', address: '22 Drilling Rd, Midland TX', notes: '' },
    ];
    for (const c of customers) {
      await conn.execute(
        `INSERT INTO customers (id, org_id, name, type, email, phone, address, notes, status)
         VALUES (?,?,?,?,?,?,?,?,'active')`,
        [c.id, orgId, c.name, c.type, c.email, c.phone, c.address, c.notes]
      );
    }

    /* ── 6. Bookings (mix of statuses + dates) ── */
    const bookingDefs = [
      // Active / ongoing
      { custIdx: 0, eqIdx: 0,  unitStatus: 'rented-out', start: -5,  end: 5,   status: 'active',    deposit: 900,  notes: 'Phase 1 excavation' },
      { custIdx: 1, eqIdx: 2,  unitStatus: 'rented-out', start: -2,  end: 10,  status: 'active',    deposit: 2400, notes: 'Tower crane for level 12–18' },
      { custIdx: 4, eqIdx: 6,  unitStatus: 'rented-out', start: -1,  end: 7,   status: 'active',    deposit: 700,  notes: 'Site power backup' },
      { custIdx: 6, eqIdx: 10, unitStatus: 'rented-out', start: -3,  end: 11,  status: 'active',    deposit: 1600, notes: 'Solar panel installation scaffolding' },
      // Pending (upcoming)
      { custIdx: 2, eqIdx: 1,  unitStatus: 'available',  start: 3,   end: 12,  status: 'pending',   deposit: 1000, notes: 'Foundation dig' },
      { custIdx: 3, eqIdx: 7,  unitStatus: 'available',  start: 5,   end: 9,   status: 'pending',   deposit: 300,  notes: 'Event backup power' },
      { custIdx: 5, eqIdx: 11, unitStatus: 'available',  start: 7,   end: 10,  status: 'pending',   deposit: 130,  notes: 'House renovation' },
      // Completed
      { custIdx: 0, eqIdx: 4,  unitStatus: 'available',  start: -30, end: -20, status: 'completed', deposit: 440,  notes: 'Pipe trench compressors', actualCost: 2200 },
      { custIdx: 1, eqIdx: 8,  unitStatus: 'available',  start: -25, end: -15, status: 'completed', deposit: 560,  notes: 'Warehouse forklift hire', actualCost: 2800 },
      { custIdx: 7, eqIdx: 3,  unitStatus: 'available',  start: -20, end: -14, status: 'completed', deposit: 360,  notes: 'Lifting equipment for drilling rig', actualCost: 1080 },
      { custIdx: 2, eqIdx: 9,  unitStatus: 'available',  start: -18, end: -10, status: 'completed', deposit: 480,  notes: 'Warehouse reach truck', actualCost: 1920 },
      // Overdue
      { custIdx: 4, eqIdx: 5,  unitStatus: 'rented-out', start: -14, end: -3,  status: 'overdue',   deposit: 320,  notes: 'Compressor still on site' },
    ];

    const bookingIds = [];
    for (const b of bookingDefs) {
      const bid = uuidv4();
      bookingIds.push(bid);
      const eq = equip[b.eqIdx];
      const cust = customers[b.custIdx];
      const days = Math.abs(b.end - b.start) || 1;
      const estCost = eq.fixed_rate * days;
      await conn.execute(
        `INSERT INTO bookings
          (id, org_id, customer_id, equipment_id, start_date, end_date,
           pricing_type, fixed_rate, estimated_cost, actual_cost,
           security_deposit, deposit_returned, status, notes, returned_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          bid, orgId, cust.id, eq.id,
          d(b.start), d(b.end),
          eq.pricing_type === 'daily' ? 'fixed' : eq.pricing_type,
          eq.fixed_rate, estCost,
          b.actualCost ?? null,
          b.deposit,
          b.status === 'completed' ? 1 : 0,
          b.status, b.notes,
          b.status === 'completed' ? dt(b.end) : null,
        ]
      );

      // Booking item
      await conn.execute(
        `INSERT INTO booking_items
          (id, org_id, booking_id, equipment_id, description, pricing_type, unit_rate, quantity, line_total)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), orgId, bid, eq.id, eq.name,
         eq.billing_period || 'daily', eq.fixed_rate, days, estCost]
      );
    }

    /* ── 7. Penalties ── */
    // Late return on overdue booking (bookingDefs index 11 = overdue)
    const overdueBid = bookingIds[11];
    await conn.execute(
      `INSERT INTO penalties (id, org_id, booking_id, customer_id, type, amount, days_overdue, description, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), orgId, overdueBid, customers[4].id,
       'late_return', 480.00, 3, 'Compressor returned 3 days late — daily penalty applied', 'pending']
    );
    // Damage on completed booking (index 8)
    const damageBid = bookingIds[8];
    await conn.execute(
      `INSERT INTO penalties (id, org_id, booking_id, customer_id, type, amount, days_overdue, description, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), orgId, damageBid, customers[1].id,
       'damage', 750.00, 0, 'Fork tine scratched warehouse floor — repair cost billed', 'invoiced']
    );

    /* ── 8. Maintenance schedules ── */
    const maintDefs = [
      { eqIdx: 0,  type: 'preventive', freq: 'monthly',   next: 15,  due: 15,  status: 'scheduled', title: 'Hydraulic fluid & filter change', cost: 350 },
      { eqIdx: 1,  type: 'inspection', freq: 'quarterly', next: 30,  due: 30,  status: 'scheduled', title: 'Annual safety inspection',        cost: 200 },
      { eqIdx: 2,  type: 'preventive', freq: 'monthly',   next: 20,  due: 20,  status: 'scheduled', title: 'Crane cable inspection & lube',   cost: 500 },
      { eqIdx: 4,  type: 'corrective', freq: 'one-time',  next: 5,   due: 5,   status: 'in-progress', title: 'Air intake seal replacement',   cost: 180 },
      { eqIdx: 6,  type: 'preventive', freq: 'quarterly', next: 45,  due: 45,  status: 'scheduled', title: 'Generator service & load test',   cost: 400 },
      { eqIdx: 8,  type: 'preventive', freq: 'monthly',   next: 10,  due: 10,  status: 'scheduled', title: 'Forklift battery service',        cost: 120 },
      { eqIdx: 1,  type: 'corrective', freq: 'one-time',  next: -5,  due: -5,  status: 'overdue',   title: 'Track shoe bolt retorque',        cost: 250 },
      { eqIdx: 3,  type: 'preventive', freq: 'half-yearly', next: 60, due: 60, status: 'completed', title: 'Hoist brake pad replacement',     cost: 310, completedAt: -2 },
    ];
    for (const m of maintDefs) {
      const mid = uuidv4();
      await conn.execute(
        `INSERT INTO maintenance_schedules
          (id, org_id, equipment_id, type, frequency, description, scheduled_date, next_due_date,
           cost, status, notes, completed_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          mid, orgId, equip[m.eqIdx].id,
          m.type, m.freq, m.title,
          d(m.due), d(m.next + 30),
          m.cost, m.status,
          m.status === 'overdue' ? 'Missed last service window — reschedule urgently' : null,
          m.completedAt != null ? d(m.completedAt) : null,
        ]
      );
    }

    /* ── 9. Condition reports ── */
    const condDefs = [
      { eqIdx: 5,  dmg: 'moderate', desc: 'Air filter housing cracked, minor oil seepage', status: 'open',       repairReq: 1, cost: 320 },
      { eqIdx: 1,  dmg: 'minor',    desc: 'Windscreen chip on cab — cosmetic only',          status: 'in_review',  repairReq: 0, cost: 0   },
      { eqIdx: 8,  dmg: 'minor',    desc: 'Fork left side paint chip from warehouse impact', status: 'resolved',   repairReq: 0, cost: 0   },
      { eqIdx: 2,  dmg: 'severe',   desc: 'Wire rope showing 3 broken strands — replace now', status: 'open',      repairReq: 1, cost: 1800 },
      { eqIdx: 0,  dmg: 'none',     desc: 'Post-rental inspection — no damage found',        status: 'resolved',   repairReq: 0, cost: 0   },
    ];
    for (const cr of condDefs) {
      await conn.execute(
        `INSERT INTO condition_reports
          (id, org_id, equipment_id, damage_level, description, status, repair_required, repair_cost, reported_by)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          uuidv4(), orgId, equip[cr.eqIdx].id,
          cr.dmg, cr.desc, cr.status, cr.repairReq, cr.cost,
          req.user.id,
        ]
      );
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Demo data loaded successfully',
      data: {
        categories:   cats.length,
        equipment:    equip.length,
        units:        unitRows.length,
        customers:    customers.length,
        bookings:     bookingDefs.length,
        penalties:    2,
        maintenance:  maintDefs.length,
        condition_reports: condDefs.length,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('[demo-seed]', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = { resetAndSeed };
