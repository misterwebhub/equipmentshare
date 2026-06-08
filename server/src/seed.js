/**
 * Seeder — populates the in-memory store with realistic multi-tenant data.
 *
 * Creates:
 *   - 1 super admin (platform owner)
 *   - subscription plans
 *   - 2 organizations (tenants), each with its own admin + staff, customers,
 *     equipment, rentals, maintenance, etc.
 *   - subscription records (one active, one trialing) so the super-admin
 *     billing screens have data to manage.
 *
 * Called automatically on server boot (src/index.js) and re-runnable via
 * `npm run seed`. Passwords are bcrypt-hashed.
 */
import bcrypt from 'bcryptjs';
import { db } from './store.js';

const hash = (pw) => bcrypt.hashSync(pw, 8);
const iso = (d) => new Date(d).toISOString();

export function seed() {
  // Reset
  Object.keys(db).forEach((k) => {
    db[k].length = 0;
  });

  // ---- Plans -------------------------------------------------------------
  db.plans.push(
    {
      id: 'plan-starter',
      name: 'Starter',
      price: 49,
      interval: 'month',
      equipmentLimit: 25,
      userLimit: 5,
      features: ['Up to 25 equipment items', '5 team members', 'Core modules', 'Email support'],
    },
    {
      id: 'plan-pro',
      name: 'Professional',
      price: 149,
      interval: 'month',
      equipmentLimit: 200,
      userLimit: 25,
      features: [
        'Up to 200 equipment items',
        '25 team members',
        'All modules + analytics',
        'Maintenance scheduling',
        'Priority support',
      ],
      popular: true,
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      price: 399,
      interval: 'month',
      equipmentLimit: -1,
      userLimit: -1,
      features: [
        'Unlimited equipment',
        'Unlimited team members',
        'All modules + advanced analytics',
        'Custom integrations',
        'Dedicated account manager',
      ],
    }
  );

  // ---- Super Admin -------------------------------------------------------
  db.users.push({
    id: 'user-superadmin',
    name: 'Platform Owner',
    email: 'superadmin@equiptrack.io',
    passwordHash: hash('superadmin123'),
    role: 'superadmin',
    orgId: null,
    status: 'active',
    createdAt: iso('2024-01-01'),
  });

  // ---- Organizations -----------------------------------------------------
  const orgs = [
    {
      id: 'org-1',
      name: 'BuildRight Construction',
      slug: 'buildright',
      category: 'construction',
      email: 'admin@buildright.com',
      phone: '555-0101',
      address: '123 Construction Ave, City, State',
      status: 'active',
      createdAt: iso('2024-01-15'),
    },
    {
      id: 'org-2',
      name: 'Pro Event Solutions',
      slug: 'proevents',
      category: 'events',
      email: 'admin@proevents.com',
      phone: '555-0102',
      address: '456 Event Street, City, State',
      status: 'active',
      createdAt: iso('2024-02-01'),
    },
  ];
  orgs.forEach((o) => db.organizations.push(o));

  // ---- Subscriptions -----------------------------------------------------
  const now = new Date();
  const plus = (days) => new Date(now.getTime() + days * 864e5).toISOString();
  db.subscriptions.push(
    {
      id: 'sub-1',
      orgId: 'org-1',
      planId: 'plan-pro',
      status: 'active',
      startedAt: iso('2024-01-15'),
      currentPeriodEnd: plus(20),
      createdAt: iso('2024-01-15'),
    },
    {
      id: 'sub-2',
      orgId: 'org-2',
      planId: 'plan-starter',
      status: 'trialing',
      startedAt: iso('2024-02-01'),
      currentPeriodEnd: plus(7),
      createdAt: iso('2024-02-01'),
    }
  );

  // ---- Org admins + staff (login-capable users) --------------------------
  db.users.push(
    {
      id: 'user-1',
      name: 'John Smith',
      email: 'admin@buildright.com',
      passwordHash: hash('password123'),
      role: 'admin',
      orgId: 'org-1',
      status: 'active',
      createdAt: iso('2024-01-15'),
    },
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      email: 'manager@buildright.com',
      passwordHash: hash('password123'),
      role: 'manager',
      orgId: 'org-1',
      status: 'active',
      createdAt: iso('2024-01-20'),
    },
    {
      id: 'user-3',
      name: 'Mike Davis',
      email: 'admin@proevents.com',
      passwordHash: hash('password123'),
      role: 'admin',
      orgId: 'org-2',
      status: 'active',
      createdAt: iso('2024-02-05'),
    }
  );

  // ---- People (staff/operators) ------------------------------------------
  db.people.push(
    { id: 'person-1', orgId: 'org-1', name: 'John Smith', email: 'john@buildright.com', role: 'admin', assignedEquipment: ['equip-1', 'equip-2'], activeRentals: ['rental-1'], status: 'active', createdAt: iso('2024-01-15') },
    { id: 'person-2', orgId: 'org-1', name: 'Sarah Johnson', email: 'sarah@buildright.com', role: 'manager', assignedEquipment: ['equip-3'], activeRentals: ['rental-2'], status: 'active', createdAt: iso('2024-01-20') },
    { id: 'person-3', orgId: 'org-2', name: 'Mike Davis', email: 'mike@proevents.com', role: 'operator', assignedEquipment: ['equip-5', 'equip-6'], activeRentals: [], status: 'active', createdAt: iso('2024-02-05') },
    { id: 'person-4', orgId: 'org-2', name: 'Emily Chen', email: 'emily@proevents.com', role: 'manager', assignedEquipment: [], activeRentals: [], status: 'active', createdAt: iso('2024-01-25') }
  );

  // ---- Customers (partner companies the org rents to/from) ---------------
  db.companies.push(
    { id: 'comp-1', orgId: 'org-1', name: 'Metro Developers LLC', category: 'construction', contact: { email: 'contact@metrodev.com', phone: '555-0201', address: '900 Skyline Blvd' }, canRentEquipment: true, canProvideEquipment: false, status: 'active', createdAt: iso('2024-01-18') },
    { id: 'comp-2', orgId: 'org-1', name: 'Harbor Logistics', category: 'manufacturing', contact: { email: 'ops@harborlog.com', phone: '555-0202', address: '12 Dock Road' }, canRentEquipment: true, canProvideEquipment: true, status: 'active', createdAt: iso('2024-02-02') },
    { id: 'comp-3', orgId: 'org-2', name: 'Grand Hotels Group', category: 'hospitality', contact: { email: 'events@grandhotels.com', phone: '555-0203', address: '500 Grand Ave' }, canRentEquipment: true, canProvideEquipment: false, status: 'active', createdAt: iso('2024-02-08') },
    { id: 'comp-4', orgId: 'org-2', name: 'City Festivals Inc', category: 'events', contact: { email: 'book@cityfest.com', phone: '555-0204', address: '77 Park Lane' }, canRentEquipment: true, canProvideEquipment: false, status: 'inactive', createdAt: iso('2024-02-12') }
  );

  // ---- Equipment ---------------------------------------------------------
  db.equipment.push(
    { id: 'equip-1', orgId: 'org-1', name: 'Excavator CAT 320', description: 'Heavy duty excavator for digging and earthmoving', category: 'construction-excavators', status: 'in-use', pricingType: 'fixed', fixedRate: 450, assignedPersonId: 'person-1', assignedProjectId: 'proj-1', location: 'Job Site A', certifications: ['Heavy Equipment Operation'], condition: 'good', lastMaintenance: iso('2024-05-10'), specifications: { 'Bucket Capacity': '1.0 cubic meter', 'Engine Power': '140 HP', 'Max Reach': '10.3 meters' }, createdAt: iso('2024-01-10') },
    { id: 'equip-2', orgId: 'org-1', name: 'Concrete Mixer', description: 'Portable concrete mixer for job site use', category: 'construction-tools', status: 'available', pricingType: 'both', fixedRate: 80, hourlyRate: 15, location: 'Warehouse A', certifications: [], condition: 'excellent', lastMaintenance: iso('2024-05-15'), specifications: { Capacity: '450 liters', Power: '2 HP', Weight: '350 kg' }, createdAt: iso('2024-01-12') },
    { id: 'equip-3', orgId: 'org-1', name: 'Forklift Toyota 5FGU45', description: 'Industrial forklift for material handling', category: 'construction-forklifts', status: 'rented-out', pricingType: 'fixed', fixedRate: 120, assignedPersonId: 'person-2', location: 'Client Site B', certifications: ['Forklift Operation', 'Safety Certification'], condition: 'good', lastMaintenance: iso('2024-05-18'), specifications: { 'Lift Height': '4.8 meters', Capacity: '2000 kg', 'Mast Type': 'Triple Stage' }, createdAt: iso('2024-01-15') },
    { id: 'equip-4', orgId: 'org-2', name: 'Pro Sound System 3000', description: 'Professional audio system for large events', category: 'events-audio', status: 'maintenance', pricingType: 'fixed', fixedRate: 350, location: 'Service Center', certifications: ['Audio Engineering'], condition: 'fair', lastMaintenance: iso('2024-05-20'), specifications: { Output: '10,000W RMS', Frequency: '20Hz-20kHz', Inputs: '24 channels' }, createdAt: iso('2024-02-01') },
    { id: 'equip-5', orgId: 'org-2', name: 'LED Lighting Rig 500', description: 'Professional stage lighting setup', category: 'events-lighting', status: 'available', pricingType: 'both', fixedRate: 200, hourlyRate: 40, assignedPersonId: 'person-3', location: 'Warehouse B', certifications: ['Electrical Safety'], condition: 'excellent', lastMaintenance: iso('2024-05-16'), specifications: { Power: '5000W', 'Color Output': 'RGB + White', Coverage: '150 meters diameter' }, createdAt: iso('2024-02-03') },
    { id: 'equip-6', orgId: 'org-2', name: 'Event Tent 50x30', description: 'Large event tent for outdoor gatherings', category: 'events-tents', status: 'in-use', pricingType: 'fixed', fixedRate: 300, assignedPersonId: 'person-3', assignedProjectId: 'proj-2', location: 'Event Venue', certifications: [], condition: 'excellent', lastMaintenance: iso('2024-05-19'), specifications: { Size: '50m x 30m', Height: '6 meters', Capacity: '500 people' }, createdAt: iso('2024-02-05') },
    { id: 'equip-7', orgId: 'org-1', name: 'CNC Milling Machine 5-Axis', description: 'Precision CNC machine for manufacturing', category: 'manufacturing-cnc', status: 'available', pricingType: 'hourly', hourlyRate: 150, location: 'Factory A', certifications: ['CNC Operation', 'Machine Safety'], condition: 'excellent', lastMaintenance: iso('2024-05-12'), specifications: { 'Spindle Speed': '10,000 RPM', Accuracy: '±0.02mm', 'Table Size': '2000x1000mm' }, createdAt: iso('2024-01-20') },
    { id: 'equip-8', orgId: 'org-1', name: 'Industrial Compressor 150 PSI', description: 'Heavy duty air compressor', category: 'manufacturing-tools', status: 'damaged', pricingType: 'fixed', fixedRate: 90, location: 'Maintenance Shop', certifications: ['Pressure Equipment'], condition: 'poor', lastMaintenance: iso('2024-04-20'), specifications: { Output: '500 CFM', Pressure: '150 PSI', Power: '25 HP' }, createdAt: iso('2024-01-25') }
  );

  // ---- Projects ----------------------------------------------------------
  db.projects.push(
    { id: 'proj-1', orgId: 'org-1', name: 'Downtown Office Complex', description: 'Large commercial office building construction', status: 'active', startDate: iso('2024-03-01'), endDate: iso('2024-08-31'), assignedEquipment: ['equip-1', 'equip-3'], assignedPeople: ['person-1', 'person-2'], createdAt: iso('2024-02-15') },
    { id: 'proj-2', orgId: 'org-2', name: 'Summer Music Festival 2024', description: 'Large outdoor music festival', status: 'active', startDate: iso('2024-06-15'), endDate: iso('2024-06-17'), assignedEquipment: ['equip-4', 'equip-5', 'equip-6'], assignedPeople: ['person-3'], createdAt: iso('2024-05-01') }
  );

  // ---- Rentals -----------------------------------------------------------
  db.rentals.push(
    { id: 'rental-1', orgId: 'org-1', rentalCompanyId: 'comp-1', equipmentProviderCompanyId: 'org-1', equipmentIds: ['equip-2'], assignedPersonId: 'person-1', projectId: 'proj-1', startDate: iso('2024-06-10'), endDate: iso('2024-06-18'), pricingModel: 'fixed', estimatedCost: 640, actualCost: 640, status: 'completed', notes: 'Concrete mixer rental', createdAt: iso('2024-06-01') },
    { id: 'rental-2', orgId: 'org-1', rentalCompanyId: 'comp-2', equipmentProviderCompanyId: 'org-1', equipmentIds: ['equip-3'], assignedPersonId: 'person-2', projectId: 'proj-1', startDate: iso('2024-05-20'), endDate: iso('2024-06-03'), pricingModel: 'fixed', estimatedCost: 1680, actualCost: 1680, status: 'active', notes: 'Forklift for materials handling', createdAt: iso('2024-05-15') },
    { id: 'rental-3', orgId: 'org-1', rentalCompanyId: 'comp-1', equipmentProviderCompanyId: 'org-1', equipmentIds: ['equip-7'], assignedPersonId: 'person-1', startDate: iso('2024-06-01'), endDate: iso('2024-06-05'), pricingModel: 'hourly', estimatedCost: 3600, hoursUsed: 24, actualCost: 3600, status: 'active', notes: 'CNC machine rental for custom fabrication', createdAt: iso('2024-05-25') },
    { id: 'rental-4', orgId: 'org-1', rentalCompanyId: 'comp-2', equipmentProviderCompanyId: 'org-1', equipmentIds: ['equip-1'], assignedPersonId: 'person-1', projectId: 'proj-1', startDate: iso('2024-05-25'), endDate: iso('2024-06-10'), pricingModel: 'fixed', estimatedCost: 6750, actualCost: 6750, status: 'overdue', notes: 'Excavator for site preparation', createdAt: iso('2024-05-20') },
    { id: 'rental-5', orgId: 'org-2', rentalCompanyId: 'comp-3', equipmentProviderCompanyId: 'org-2', equipmentIds: ['equip-5'], assignedPersonId: 'person-3', projectId: 'proj-2', startDate: iso('2024-06-15'), endDate: iso('2024-06-17'), pricingModel: 'fixed', estimatedCost: 600, actualCost: 600, status: 'active', notes: 'Stage lighting for festival', createdAt: iso('2024-06-01') },
    { id: 'rental-6', orgId: 'org-2', rentalCompanyId: 'comp-4', equipmentProviderCompanyId: 'org-2', equipmentIds: ['equip-6'], assignedPersonId: 'person-3', startDate: iso('2024-05-28'), endDate: iso('2024-06-02'), pricingModel: 'fixed', estimatedCost: 1500, actualCost: 1500, status: 'completed', notes: 'Event tent rental', createdAt: iso('2024-05-20') }
  );

  // ---- Maintenance -------------------------------------------------------
  db.maintenance.push(
    { id: 'maint-1', orgId: 'org-1', equipmentId: 'equip-1', type: 'preventive', scheduledDate: iso('2024-06-10'), description: 'Regular oil change and filter replacement', cost: 250, status: 'scheduled', createdAt: iso('2024-05-20') },
    { id: 'maint-2', orgId: 'org-2', equipmentId: 'equip-4', type: 'corrective', scheduledDate: iso('2024-05-25'), completedDate: iso('2024-05-27'), description: 'Amplifier repair and recalibration', cost: 500, status: 'completed', notes: 'Replaced power module, all systems tested', createdAt: iso('2024-05-20') },
    { id: 'maint-3', orgId: 'org-1', equipmentId: 'equip-8', type: 'corrective', scheduledDate: iso('2024-05-21'), completedDate: iso('2024-05-25'), description: 'Motor bearing replacement and rebuild', cost: 800, status: 'completed', notes: 'Major overhaul needed due to damage', createdAt: iso('2024-05-20') },
    { id: 'maint-4', orgId: 'org-1', equipmentId: 'equip-2', type: 'preventive', scheduledDate: iso('2024-06-15'), description: 'Blade inspection and replacement', cost: 150, status: 'scheduled', createdAt: iso('2024-05-30') }
  );

  // ---- Condition reports -------------------------------------------------
  db.conditionReports.push(
    { id: 'cond-1', orgId: 'org-1', equipmentId: 'equip-8', reportedDate: iso('2024-05-20'), reportedBy: 'person-1', damageLevel: 'severe', description: 'Motor bearing making grinding noise, equipment unsafe', repairRequired: true, photos: [], createdAt: iso('2024-05-20') },
    { id: 'cond-2', orgId: 'org-1', equipmentId: 'equip-1', reportedDate: iso('2024-05-18'), reportedBy: 'person-1', damageLevel: 'minor', description: 'Small dent on bucket, cosmetic damage only', repairRequired: false, createdAt: iso('2024-05-18') },
    { id: 'cond-3', orgId: 'org-2', equipmentId: 'equip-4', reportedDate: iso('2024-05-22'), reportedBy: 'person-3', damageLevel: 'moderate', description: 'Audio crackling in left channel, output reduced', repairRequired: true, createdAt: iso('2024-05-22') }
  );

  // ---- Deliveries --------------------------------------------------------
  db.deliveries.push(
    { id: 'deliv-1', orgId: 'org-1', equipmentIds: ['equip-2'], fromCompanyId: 'org-1', toCompanyId: 'comp-1', pickupDate: iso('2024-06-09'), deliveryDate: iso('2024-06-10'), status: 'delivered', driver: 'John', notes: 'Delivered to site A', createdAt: iso('2024-06-05') },
    { id: 'deliv-2', orgId: 'org-1', equipmentIds: ['equip-1'], fromCompanyId: 'org-1', toCompanyId: 'comp-2', pickupDate: iso('2024-05-24'), deliveryDate: iso('2024-05-25'), status: 'delivered', driver: 'Mike', createdAt: iso('2024-05-20') },
    { id: 'deliv-3', orgId: 'org-2', equipmentIds: ['equip-5'], fromCompanyId: 'org-2', toCompanyId: 'comp-3', pickupDate: iso('2024-06-14'), deliveryDate: iso('2024-06-15'), status: 'in-transit', driver: 'Sarah', createdAt: iso('2024-06-10') }
  );

  // ---- Notifications -----------------------------------------------------
  db.notifications.push(
    { id: 'notif-1', orgId: 'org-1', type: 'late-return', title: 'Late Return Alert', message: 'Excavator CAT 320 is overdue - returned 2 days late', priority: 'high', status: 'unread', createdAt: iso('2024-06-05') },
    { id: 'notif-2', orgId: 'org-1', type: 'maintenance-due', title: 'Maintenance Scheduled', message: 'Forklift Toyota 5FGU45 is due for maintenance on June 10th', priority: 'medium', status: 'unread', createdAt: iso('2024-06-04') },
    { id: 'notif-3', orgId: 'org-1', type: 'damage-report', title: 'Damage Reported', message: 'Industrial Compressor 150 PSI has been reported with severe damage', priority: 'high', status: 'read', createdAt: iso('2024-05-20') },
    { id: 'notif-4', orgId: 'org-2', type: 'equipment-available', title: 'Equipment Available', message: 'LED Lighting Rig 500 is now available for booking', priority: 'low', status: 'read', createdAt: iso('2024-06-01') }
  );

  // ---- Penalties ---------------------------------------------------------
  db.penalties.push(
    { id: 'penalty-1', orgId: 'org-1', rentalId: 'rental-4', type: 'late-return', amount: 675, daysOverdue: 3, description: 'Late return charge: 3 days x $225/day', status: 'pending', createdAt: iso('2024-06-10') },
    { id: 'penalty-2', orgId: 'org-1', rentalId: 'rental-2', type: 'damage', amount: 450, description: 'Damage claim: Dent on bucket requiring repair', status: 'pending', createdAt: iso('2024-05-25') },
    { id: 'penalty-3', orgId: 'org-2', rentalId: 'rental-6', type: 'late-return', amount: 160, daysOverdue: 1, description: 'Late return charge: 1 day x $160/day', status: 'paid', paidDate: iso('2024-06-20'), createdAt: iso('2024-06-18') }
  );

  // ---- Support tickets ---------------------------------------------------
  db.tickets.push(
    { id: 'ticket-1', orgId: 'org-2', title: 'Equipment Quality Issue', description: 'Audio system has crackling in one channel', customerId: 'comp-3', equipmentId: 'equip-4', priority: 'high', status: 'open', assignedTo: 'person-3', messages: [ { id: 'msg-1', sender: 'comp-3', content: 'The audio system has crackling sounds from the left channel.', timestamp: iso('2024-05-22') }, { id: 'msg-2', sender: 'person-3', content: 'We are repairing the amplifier. Should be done by tomorrow.', timestamp: iso('2024-05-23') } ], createdAt: iso('2024-05-22') },
    { id: 'ticket-2', orgId: 'org-1', title: 'Schedule Conflict', description: 'Cannot find equipment availability for requested dates', customerId: 'comp-1', priority: 'medium', status: 'open', assignedTo: 'person-2', messages: [ { id: 'msg-3', sender: 'comp-1', content: 'Need CNC machine from June 8-12 but it shows booked.', timestamp: iso('2024-06-02') } ], createdAt: iso('2024-06-02') }
  );

  // ---- Calendar events ---------------------------------------------------
  db.calendarEvents.push(
    { id: 'cal-1', orgId: 'org-1', equipmentId: 'equip-1', eventType: 'rental', startDate: iso('2024-06-10'), endDate: iso('2024-06-20'), rentalId: 'rental-4', company: 'Metro Developers LLC', status: 'active' },
    { id: 'cal-2', orgId: 'org-1', equipmentId: 'equip-2', eventType: 'maintenance', startDate: iso('2024-06-15'), endDate: iso('2024-06-16'), maintenanceId: 'maint-4', description: 'Blade inspection and replacement', status: 'scheduled' },
    { id: 'cal-3', orgId: 'org-1', equipmentId: 'equip-3', eventType: 'rental', startDate: iso('2024-05-20'), endDate: iso('2024-06-03'), rentalId: 'rental-2', company: 'Harbor Logistics', status: 'active' },
    { id: 'cal-4', orgId: 'org-2', equipmentId: 'equip-5', eventType: 'rental', startDate: iso('2024-06-15'), endDate: iso('2024-06-17'), rentalId: 'rental-5', company: 'Grand Hotels Group', status: 'active' }
  );

  // ---- Quotations --------------------------------------------------------
  db.quotations.push(
    {
      id: 'quote-1001', orgId: 'org-1', number: 'QT-1001', customerId: 'comp-1',
      issueDate: iso('2024-06-01'), validUntil: iso('2024-06-30'), status: 'sent',
      lineItems: [
        { equipmentId: 'equip-2', description: 'Concrete Mixer', qty: 1, days: 8, rate: 80, amount: 640 },
        { equipmentId: 'equip-7', description: 'CNC Machine', qty: 1, days: 1, rate: 150, amount: 150 },
      ],
      subtotal: 790, taxRate: 0.1, taxAmount: 79, discount: 0, total: 869,
      notes: 'Quote valid for 30 days. 50% deposit required to confirm.', createdAt: iso('2024-06-01'),
    },
    {
      id: 'quote-1002', orgId: 'org-1', number: 'QT-1002', customerId: 'comp-2',
      issueDate: iso('2024-06-03'), validUntil: iso('2024-07-03'), status: 'draft',
      lineItems: [
        { equipmentId: 'equip-1', description: 'Excavator CAT 320', qty: 1, days: 16, rate: 420, amount: 6720 },
      ],
      subtotal: 6720, taxRate: 0.1, taxAmount: 672, discount: 200, total: 7192,
      notes: '', createdAt: iso('2024-06-03'),
    }
  );

  // ---- Orders ------------------------------------------------------------
  db.orders.push(
    {
      id: 'order-2001', orgId: 'org-1', number: 'SO-2001', quotationId: 'quote-1001', customerId: 'comp-1',
      startDate: iso('2024-06-10'), endDate: iso('2024-06-18'), status: 'confirmed',
      lineItems: [
        { equipmentId: 'equip-2', description: 'Concrete Mixer', qty: 1, days: 8, rate: 80, amount: 640 },
      ],
      subtotal: 640, taxRate: 0.1, taxAmount: 64, discount: 0, total: 704,
      notes: 'Converted from QT-1001', createdAt: iso('2024-06-05'),
    }
  );

  // ---- Invoices ----------------------------------------------------------
  db.invoices.push(
    {
      id: 'inv-3001', orgId: 'org-1', number: 'INV-3001', orderId: 'order-2001', customerId: 'comp-1',
      issueDate: iso('2024-06-18'), dueDate: iso('2024-07-18'), status: 'unpaid',
      lineItems: [
        { equipmentId: 'equip-2', description: 'Concrete Mixer (8 days)', qty: 1, days: 8, rate: 80, amount: 640 },
      ],
      subtotal: 640, taxRate: 0.1, taxAmount: 64, discount: 0, total: 704, amountPaid: 0,
      notes: 'Net 30. Payable on receipt.', createdAt: iso('2024-06-18'),
    }
  );

  return db;
}

// Allow `npm run seed` to run standalone.
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
  console.log('Seed complete:');
  Object.entries(db).forEach(([k, v]) => console.log(`  ${k}: ${v.length}`));
}
