/**
 * EquipTrack Pro — Full API Test Suite
 * Runs against http://localhost:5000
 */
const http = require('http');

const BASE = 'http://localhost:5000';

let pass = 0, fail = 0;
const failures = [];

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function check(label, res, expectedStatus, checkFn) {
  const statusOk = res.status === expectedStatus;
  const bodyOk = checkFn ? checkFn(res.body) : true;
  const ok = statusOk && bodyOk;
  if (ok) {
    pass++;
    console.log(`  ✅ ${label} → ${res.status}`);
  } else {
    fail++;
    const detail = !statusOk ? `expected ${expectedStatus} got ${res.status}` : 'body check failed';
    const msg = `  ❌ ${label} → ${res.status} [${detail}]${res.body?.message ? ' | ' + res.body.message : ''}`;
    console.log(msg);
    failures.push(msg);
  }
  return ok;
}

async function run() {
  console.log('\n================================================');
  console.log('  EquipTrack Pro - Complete API Test Suite');
  console.log('================================================\n');

  // HEALTH
  console.log('>> HEALTH');
  const health = await req('GET', '/health');
  check('GET /health', health, 200, b => b.status === 'ok');

  // PUBLIC
  console.log('\n>> PUBLIC (no auth required)');
  const pricing = await req('GET', '/api/public/pricing');
  check('GET /api/public/pricing - 3 plans returned', pricing, 200, b => Array.isArray(b.data) && b.data.length >= 3);

  // AUTH
  console.log('\n>> AUTH');
  const badLogin = await req('POST', '/api/auth/login', { email: 'nobody@x.com', password: 'wrong' });
  check('POST /auth/login - bad credentials returns 401', badLogin, 401);

  const saLogin = await req('POST', '/api/auth/login', { email: 'superadmin@equiptrack.com', password: 'SuperAdmin@123' });
  check('POST /auth/login - superadmin login', saLogin, 200, b => b.data && b.data.accessToken && b.data.user && b.data.user.role === 'superadmin');
  const SA = saLogin.body && saLogin.body.data && saLogin.body.data.accessToken;
  const SA_REFRESH = saLogin.body && saLogin.body.data && saLogin.body.data.refreshToken;

  const orgLogin = await req('POST', '/api/auth/login', { email: 'admin@buildright.com', password: 'Admin@123' });
  check('POST /auth/login - org admin login', orgLogin, 200, b => b.data && b.data.accessToken && b.data.user.role === 'admin');
  const ORG = orgLogin.body && orgLogin.body.data && orgLogin.body.data.accessToken;

  const mgrLogin = await req('POST', '/api/auth/login', { email: 'manager@buildright.com', password: 'Manager@123' });
  check('POST /auth/login - manager login', mgrLogin, 200, b => b.data && b.data.accessToken);
  const MGR = mgrLogin.body && mgrLogin.body.data && mgrLogin.body.data.accessToken;

  const meRes = await req('GET', '/api/auth/me', null, ORG);
  check('GET /auth/me - returns current user', meRes, 200, b => b.data && b.data.user && b.data.user.email === 'admin@buildright.com');

  const refreshRes = await req('POST', '/api/auth/refresh', { refreshToken: SA_REFRESH });
  check('POST /auth/refresh - token rotation works', refreshRes, 200, b => b.data && b.data.accessToken);
  const SA2 = (refreshRes.body && refreshRes.body.data && refreshRes.body.data.accessToken) || SA;

  const noToken = await req('GET', '/api/equipment');
  check('GET /equipment - no token returns 401', noToken, 401);

  // CATEGORIES
  console.log('\n>> CATEGORIES');
  const catList = await req('GET', '/api/categories', null, ORG);
  check('GET /categories - list returns array', catList, 200, b => Array.isArray(b.data));
  console.log('     count: ' + (catList.body && catList.body.data ? catList.body.data.length : 0));

  const catCreate = await req('POST', '/api/categories', { name: 'Test Generators', color: '#ff6600', description: 'Generator equipment' }, ORG);
  check('POST /categories - create new category', catCreate, 201, b => b.data && b.data.name === 'Test Generators');
  const catId = catCreate.body && catCreate.body.data && catCreate.body.data.id;

  const catUpdate = await req('PUT', `/api/categories/${catId}`, { name: 'Generators Updated', color: '#ff8800', description: 'Updated' }, ORG);
  check('PUT /categories/:id - update category', catUpdate, 200, b => b.data && b.data.name === 'Generators Updated');

  // EQUIPMENT
  console.log('\n>> EQUIPMENT');
  const eqList = await req('GET', '/api/equipment', null, ORG);
  check('GET /equipment - list returns array', eqList, 200, b => Array.isArray(b.data));
  console.log('     count: ' + (eqList.body && eqList.body.data ? eqList.body.data.length : 0));

  const eqCreate = await req('POST', '/api/equipment', {
    name: 'Generator 50KW Test',
    category_id: catId,
    description: 'Industrial generator',
    serial_number: 'GEN-TEST-001',
    location: 'Yard B',
    condition: 'excellent',
    pricing_type: 'fixed',
    fixed_rate: 250,
    billing_period: 'daily',
    min_rental_days: 1,
    security_deposit: 500,
  }, ORG);
  check('POST /equipment - create equipment', eqCreate, 201, b => b.data && b.data.name === 'Generator 50KW Test');
  const eqId = eqCreate.body && eqCreate.body.data && eqCreate.body.data.id;

  const eqById = await req('GET', `/api/equipment/${eqId}`, null, ORG);
  check('GET /equipment/:id - fetch by ID', eqById, 200, b => b.data && b.data.id === eqId);

  const eqUpdate = await req('PUT', `/api/equipment/${eqId}`, {
    name: 'Generator 50KW Updated', category_id: catId, description: 'Updated desc',
    serial_number: 'GEN-TEST-001', location: 'Yard C', condition: 'good',
    status: 'available', pricing_type: 'fixed', fixed_rate: 275,
    billing_period: 'daily', min_rental_days: 1, security_deposit: 500,
  }, ORG);
  check('PUT /equipment/:id - update equipment', eqUpdate, 200, b => b.data && b.data.name === 'Generator 50KW Updated');

  const eqStatus = await req('PATCH', `/api/equipment/${eqId}/status`, { status: 'maintenance' }, ORG);
  check('PATCH /equipment/:id/status - set to maintenance', eqStatus, 200, b => b.success);

  await req('PATCH', `/api/equipment/${eqId}/status`, { status: 'available' }, ORG);

  const eqSearch = await req('GET', '/api/equipment?search=Generator', null, ORG);
  check('GET /equipment?search= - search filter works', eqSearch, 200, b => b.data && b.data.some(e => e.name.includes('Generator')));

  const eqStatusFilter = await req('GET', '/api/equipment?status=available', null, ORG);
  check('GET /equipment?status=available - status filter works', eqStatusFilter, 200, b => b.data && b.data.every(e => e.status === 'available'));

  const eqHist = await req('GET', `/api/equipment/${eqId}/history`, null, ORG);
  check('GET /equipment/:id/history - rental history', eqHist, 200, b => Array.isArray(b.data));

  // CUSTOMERS
  console.log('\n>> CUSTOMERS');
  const custList = await req('GET', '/api/customers', null, ORG);
  check('GET /customers - list returns array', custList, 200, b => Array.isArray(b.data));
  console.log('     count: ' + (custList.body && custList.body.data ? custList.body.data.length : 0));

  const custCreate = await req('POST', '/api/customers', {
    name: 'Apex Builders Ltd',
    email: 'apex@builders.com',
    phone: '+1-555-0200',
    address: '100 Builder St, Austin TX',
    notes: 'VIP customer',
  }, ORG);
  check('POST /customers - create customer', custCreate, 201, b => b.data && b.data.name === 'Apex Builders Ltd');
  const custId = custCreate.body && custCreate.body.data && custCreate.body.data.id;

  const custById = await req('GET', `/api/customers/${custId}`, null, ORG);
  check('GET /customers/:id - fetch with booking stats', custById, 200, b => b.data && b.data.id === custId);

  const custUpdate = await req('PUT', `/api/customers/${custId}`, {
    name: 'Apex Builders Updated', email: 'apex@builders.com',
    phone: '+1-555-0200', address: '100 Builder St', status: 'active',
  }, ORG);
  check('PUT /customers/:id - update customer', custUpdate, 200, b => b.data && b.data.name === 'Apex Builders Updated');

  const custSearch = await req('GET', '/api/customers?search=Apex', null, ORG);
  check('GET /customers?search= - search works', custSearch, 200, b => Array.isArray(b.data) && b.data.length > 0);

  // BOOKINGS
  console.log('\n>> BOOKINGS');
  const bkList = await req('GET', '/api/bookings', null, ORG);
  check('GET /bookings - list returns array', bkList, 200, b => Array.isArray(b.data));
  console.log('     count: ' + (bkList.body && bkList.body.data ? bkList.body.data.length : 0));

  const avail1 = await req('GET', `/api/bookings/availability?equipment_id=${eqId}&start_date=2026-08-10&end_date=2026-08-15`, null, ORG);
  check('GET /bookings/availability - available dates', avail1, 200, b => b.available === true);

  const bkCreate = await req('POST', '/api/bookings', {
    customer_id: custId,
    equipment_id: eqId,
    start_date: '2026-08-10',
    end_date: '2026-08-15',
    pricing_type: 'fixed',
    fixed_rate: 275,
    estimated_cost: 1375,
    security_deposit: 500,
    notes: 'First test booking',
    status: 'pending',
  }, ORG);
  check('POST /bookings - create booking', bkCreate, 201, b => b.data && b.data.customer_name === 'Apex Builders Updated');
  const bkId = bkCreate.body && bkCreate.body.data && bkCreate.body.data.id;

  const bkById = await req('GET', `/api/bookings/${bkId}`, null, ORG);
  check('GET /bookings/:id - fetch with details', bkById, 200, b => b.data && b.data.id === bkId && Array.isArray(b.data.penalties));

  const conflict = await req('POST', '/api/bookings', {
    customer_id: custId, equipment_id: eqId,
    start_date: '2026-08-12', end_date: '2026-08-18',
    pricing_type: 'fixed', fixed_rate: 275, estimated_cost: 1000, status: 'pending',
  }, ORG);
  check('POST /bookings - overlapping dates returns 409 (conflict detection)', conflict, 409);

  const avail2 = await req('GET', `/api/bookings/availability?equipment_id=${eqId}&start_date=2026-08-11&end_date=2026-08-14`, null, ORG);
  check('GET /bookings/availability - booked dates return available=false', avail2, 200, b => b.available === false);

  const bkActivate = await req('PATCH', `/api/bookings/${bkId}/status`, { status: 'active' }, ORG);
  check('PATCH /bookings/:id/status - activate booking', bkActivate, 200, b => b.success);

  const eqRentedOut = await req('GET', `/api/equipment/${eqId}`, null, ORG);
  check('Equipment auto-set to rented-out when booking activated', eqRentedOut, 200, b => b.data && b.data.status === 'rented-out');

  const bkComplete = await req('PATCH', `/api/bookings/${bkId}/status`, { status: 'completed', actual_cost: 1375 }, ORG);
  check('PATCH /bookings/:id/status - complete booking', bkComplete, 200, b => b.success);

  const eqAvailAgain = await req('GET', `/api/equipment/${eqId}`, null, ORG);
  check('Equipment auto-set to available when booking completed', eqAvailAgain, 200, b => b.data && b.data.status === 'available');

  // MAINTENANCE
  console.log('\n>> MAINTENANCE');
  const mList = await req('GET', '/api/maintenance', null, ORG);
  check('GET /maintenance - list returns array', mList, 200, b => Array.isArray(b.data));
  console.log('     count: ' + (mList.body && mList.body.data ? mList.body.data.length : 0));

  const mCreate = await req('POST', '/api/maintenance', {
    equipment_id: eqId, type: 'preventive', frequency: 'monthly',
    scheduled_date: '2026-09-01', description: 'Monthly engine service', cost: 200,
  }, ORG);
  check('POST /maintenance - schedule maintenance', mCreate, 201, b => b.data && b.data.equipment_name);
  const mId = mCreate.body && mCreate.body.data && mCreate.body.data.id;

  const mUpdate = await req('PUT', `/api/maintenance/${mId}`, {
    type: 'preventive', frequency: 'monthly', scheduled_date: '2026-09-05',
    description: 'Updated: engine + hydraulics service', cost: 350, status: 'scheduled',
  }, ORG);
  check('PUT /maintenance/:id - update schedule', mUpdate, 200, b => b.data && b.data.cost === '350.00');

  const mComplete = await req('PATCH', `/api/maintenance/${mId}/complete`, {
    notes: 'Completed on time. All checks passed.', cost: 350, next_due_date: '2026-10-05',
  }, ORG);
  check('PATCH /maintenance/:id/complete - mark done', mComplete, 200, b => b.success);

  const crCreate = await req('POST', '/api/maintenance/condition-reports', {
    equipment_id: eqId,
    damage_level: 'minor',
    description: 'Small dent on fuel tank cover',
    repair_required: false,
  }, ORG);
  check('POST /maintenance/condition-reports - create report', crCreate, 201, b => b.data && b.data.equipment_name);

  const crList = await req('GET', '/api/maintenance/condition-reports', null, ORG);
  check('GET /maintenance/condition-reports - list all reports', crList, 200, b => Array.isArray(b.data) && b.data.length > 0);

  const mStatusFilter = await req('GET', '/api/maintenance?status=completed', null, ORG);
  check('GET /maintenance?status=completed - filter works', mStatusFilter, 200, b => b.data && b.data.every(m => m.status === 'completed'));

  // PENALTIES
  console.log('\n>> PENALTIES');
  const pList = await req('GET', '/api/penalties', null, ORG);
  check('GET /penalties - list returns array', pList, 200, b => Array.isArray(b.data));

  const pCreate = await req('POST', '/api/penalties', {
    booking_id: bkId, customer_id: custId, type: 'damage',
    amount: 750, description: 'Cracked exhaust manifold',
  }, ORG);
  check('POST /penalties - create damage penalty', pCreate, 201, b => b.data && b.data.type === 'damage');
  const pId = pCreate.body && pCreate.body.data && pCreate.body.data.id;

  const pCreate2 = await req('POST', '/api/penalties', {
    booking_id: bkId, customer_id: custId, type: 'other', amount: 50, description: 'Cleaning fee',
  }, ORG);
  const pId2 = pCreate2.body && pCreate2.body.data && pCreate2.body.data.id;

  const pWaive = await req('PATCH', `/api/penalties/${pId}/waive`, { reason: 'Customer long-term relationship goodwill gesture' }, ORG);
  check('PATCH /penalties/:id/waive - waive penalty', pWaive, 200, b => b.success);

  const pPaid = await req('PATCH', `/api/penalties/${pId2}/mark-paid`, {}, ORG);
  check('PATCH /penalties/:id/mark-paid - mark as paid', pPaid, 200, b => b.success);

  const pStatusFilter = await req('GET', '/api/penalties?status=waived', null, ORG);
  check('GET /penalties?status=waived - filter works', pStatusFilter, 200, b => Array.isArray(b.data));

  // REPORTS
  console.log('\n>> REPORTS');
  const dash = await req('GET', '/api/reports/dashboard', null, ORG);
  check('GET /reports/dashboard - KPI stats', dash, 200, b => b.data && b.data.equipment && b.data.bookings && b.data.revenue);
  if (dash.body && dash.body.data) {
    const d = dash.body.data;
    console.log(`     equipment: total=${d.equipment && d.equipment.total}, available=${d.equipment && d.equipment.available}, maintenance=${d.equipment && d.equipment.maintenance}`);
    console.log(`     bookings: active=${d.bookings && d.bookings.active}, overdue=${d.bookings && d.bookings.overdue}, pending=${d.bookings && d.bookings.pending}`);
    console.log(`     month revenue: $${d.revenue && d.revenue.month_revenue}, pending penalties: $${d.penalties && d.penalties.pending_penalties}`);
    console.log(`     maintenance alerts: ${d.maintenance_alerts}, recent bookings: ${d.recent_bookings && d.recent_bookings.length}`);
  }

  const revReport = await req('GET', '/api/reports/revenue?months=6', null, ORG);
  check('GET /reports/revenue?months=6 - monthly + by-equipment + by-customer', revReport, 200,
    b => b.data && Array.isArray(b.data.monthly) && Array.isArray(b.data.by_equipment) && Array.isArray(b.data.by_customer));

  const utilReport = await req('GET', '/api/reports/utilisation', null, ORG);
  check('GET /reports/utilisation - equipment utilisation data', utilReport, 200, b => Array.isArray(b.data));
  console.log('     utilisation records: ' + (utilReport.body && utilReport.body.data ? utilReport.body.data.length : 0));

  // CALENDAR
  console.log('\n>> CALENDAR');
  const calEvents = await req('GET', '/api/calendar/events?from=2026-06-01&to=2026-09-30', null, ORG);
  check('GET /calendar/events - events in date range', calEvents, 200, b => Array.isArray(b.data));
  console.log('     events found: ' + (calEvents.body && calEvents.body.data ? calEvents.body.data.length : 0));

  const calBlock = await req('POST', '/api/calendar/block', {
    equipment_id: eqId,
    start_date: '2026-10-01',
    end_date: '2026-10-05',
    reason: 'Annual certification inspection',
  }, ORG);
  check('POST /calendar/block - block equipment dates', calBlock, 201, b => b.success);

  const calEquipFilter = await req('GET', `/api/calendar/events?from=2026-06-01&to=2026-09-30&equipment_id=${eqId}`, null, ORG);
  check('GET /calendar/events?equipment_id= - filter by equipment', calEquipFilter, 200, b => Array.isArray(b.data));

  // USERS
  console.log('\n>> USERS');
  const userList = await req('GET', '/api/users', null, ORG);
  check('GET /users - list org users', userList, 200, b => Array.isArray(b.data));
  console.log('     users in org: ' + (userList.body && userList.body.data ? userList.body.data.length : 0));

  const inviteEmail = `field.op.${Date.now()}@buildright.com`;
  const userInvite = await req('POST', '/api/users/invite', {
    name: 'Test Field Operator',
    email: inviteEmail,
    role: 'operator',
  }, ORG);
  check('POST /users/invite - invite new user', userInvite, 201, b => b.data && b.data.email === inviteEmail && b.temp_password);
  const newUserId = userInvite.body && userInvite.body.data && userInvite.body.data.id;
  if (userInvite.body) {
    console.log('     temp_password issued: ' + (userInvite.body.temp_password ? 'YES (' + userInvite.body.temp_password + ')' : 'NO'));
  }

  const userUpdate = await req('PUT', `/api/users/${newUserId}`, { name: 'Test Field Operator Updated', role: 'viewer' }, ORG);
  check('PUT /users/:id - update user role', userUpdate, 200, b => b.success);

  const mgrInvite = await req('POST', '/api/users/invite', { name: 'X', email: 'x@x.com', role: 'operator' }, MGR);
  check('POST /users/invite as manager - should return 403', mgrInvite, 403);

  const userDeactivate = await req('PATCH', `/api/users/${newUserId}/deactivate`, {}, ORG);
  check('PATCH /users/:id/deactivate - deactivate user', userDeactivate, 200, b => b.success);

  // SETTINGS
  console.log('\n>> SETTINGS');
  const profile = await req('GET', '/api/settings/profile', null, ORG);
  check('GET /settings/profile - org profile', profile, 200, b => b.data && b.data.name);
  console.log('     org name: ' + (profile.body && profile.body.data ? profile.body.data.name : ''));

  const profileUpdate = await req('PUT', '/api/settings/profile', {
    name: 'BuildRight Construction Co',
    category: 'construction',
    phone: '+1-555-0100',
    address: '123 Construction Ave, Dallas TX 75001',
    currency: 'USD',
  }, ORG);
  check('PUT /settings/profile - update org details', profileUpdate, 200, b => b.success);

  const billing = await req('GET', '/api/settings/billing', null, ORG);
  check('GET /settings/billing - subscription + plan info', billing, 200, b => b.data && b.data.organisation);
  if (billing.body && billing.body.data && billing.body.data.subscription) {
    console.log('     plan: ' + billing.body.data.subscription.plan_name + ', status: ' + billing.body.data.subscription.status);
  }

  const wrongPwd = await req('PUT', '/api/settings/password', { current_password: 'WrongPass!1', new_password: 'NewPass@999' }, ORG);
  check('PUT /settings/password - wrong current password returns 400', wrongPwd, 400);

  const correctPwd = await req('PUT', '/api/settings/password', { current_password: 'Admin@123', new_password: 'Admin@123' }, ORG);
  check('PUT /settings/password - correct password change', correctPwd, 200, b => b.success);

  // SUPERADMIN
  console.log('\n>> SUPERADMIN');

  const saBlocked = await req('GET', '/api/superadmin/dashboard', null, ORG);
  check('GET /superadmin/dashboard with org token - returns 403', saBlocked, 403);

  const saDash = await req('GET', '/api/superadmin/dashboard', null, SA2);
  check('GET /superadmin/dashboard - platform overview', saDash, 200, b => b.data && b.data.organisations);
  if (saDash.body && saDash.body.data) {
    const d = saDash.body.data;
    console.log(`     total orgs: ${d.organisations.total}, active: ${d.organisations.active}, trial: ${d.organisations.trial}`);
    console.log(`     MRR: $${d.mrr}, new(30d): ${d.new_orgs_30d}`);
  }

  const saOrgs = await req('GET', '/api/superadmin/organisations', null, SA2);
  check('GET /superadmin/organisations - all organisations', saOrgs, 200, b => Array.isArray(b.data) && b.data.length > 0);
  console.log('     total orgs: ' + (saOrgs.body ? saOrgs.body.total : 0));
  const orgRow = saOrgs.body && saOrgs.body.data && saOrgs.body.data.find(o => o.slug === 'buildright-demo');
  const orgId = orgRow && orgRow.id;

  const saOrgSearch = await req('GET', '/api/superadmin/organisations?search=BuildRight', null, SA2);
  check('GET /superadmin/organisations?search= - search filter', saOrgSearch, 200, b => Array.isArray(b.data));

  const saOrgById = await req('GET', `/api/superadmin/organisations/${orgId}`, null, SA2);
  check('GET /superadmin/organisations/:id - org detail with users+subs', saOrgById, 200,
    b => b.data && b.data.id === orgId && Array.isArray(b.data.users) && Array.isArray(b.data.subscriptions));
  if (saOrgById.body && saOrgById.body.data) {
    console.log(`     users in org: ${saOrgById.body.data.users.length}, subs: ${saOrgById.body.data.subscriptions.length}`);
  }

  const saSuspend = await req('PATCH', `/api/superadmin/organisations/${orgId}/status`, { status: 'suspended' }, SA2);
  check('PATCH /superadmin/organisations/:id/status - suspend org', saSuspend, 200, b => b.success);

  const saReactivate = await req('PATCH', `/api/superadmin/organisations/${orgId}/status`, { status: 'active' }, SA2);
  check('PATCH /superadmin/organisations/:id/status - reactivate org', saReactivate, 200, b => b.success);

  const saPlans = await req('GET', '/api/superadmin/plans', null, SA2);
  check('GET /superadmin/plans - all plans', saPlans, 200, b => Array.isArray(b.data) && b.data.length >= 3);
  console.log('     total plans: ' + (saPlans.body && saPlans.body.data ? saPlans.body.data.length : 0));

  const saPlanCreate = await req('POST', '/api/superadmin/plans', {
    name: 'Custom Enterprise Plus',
    price_monthly: 499,
    price_yearly: 4790,
    max_equipment: 9999,
    max_users: 9999,
    features: { reports: true, api: true, white_label: true },
    is_active: 1,
  }, SA2);
  check('POST /superadmin/plans - create new plan', saPlanCreate, 201, b => b.data && b.data.name === 'Custom Enterprise Plus');
  const newPlanId = saPlanCreate.body && saPlanCreate.body.data && saPlanCreate.body.data.id;

  const saPlanUpdate = await req('PUT', `/api/superadmin/plans/${newPlanId}`, {
    name: 'Custom Enterprise Plus v2',
    price_monthly: 549, price_yearly: 5190,
    max_equipment: 9999, max_users: 9999,
    features: { reports: true, api: true, white_label: true, sso: true },
    is_active: 1,
  }, SA2);
  check('PUT /superadmin/plans/:id - update plan', saPlanUpdate, 200, b => b.data && b.data.name === 'Custom Enterprise Plus v2');

  const saSubs = await req('GET', '/api/superadmin/subscriptions', null, SA2);
  check('GET /superadmin/subscriptions - all subscriptions', saSubs, 200, b => Array.isArray(b.data));
  console.log('     total subscriptions: ' + (saSubs.body && saSubs.body.data ? saSubs.body.data.length : 0));

  const saSubCreate = await req('POST', '/api/superadmin/subscriptions', {
    org_id: orgId,
    plan_id: newPlanId,
    billing_cycle: 'monthly',
    starts_at: '2026-06-01',
    ends_at: '2026-12-31',
    amount: 549,
    status: 'active',
    notes: 'Manual upgrade by superadmin',
  }, SA2);
  check('POST /superadmin/subscriptions - manual subscription', saSubCreate, 201, b => b.data && b.data.org_name === 'BuildRight Construction Co');
  const newSubId = saSubCreate.body && saSubCreate.body.data && saSubCreate.body.data.id;

  const saSubUpdate = await req('PUT', `/api/superadmin/subscriptions/${newSubId}`, {
    plan_id: newPlanId, status: 'active', billing_cycle: 'yearly',
    starts_at: '2026-06-01', ends_at: '2026-12-31', amount: 5190,
    notes: 'Switched to annual billing',
  }, SA2);
  check('PUT /superadmin/subscriptions/:id - update subscription', saSubUpdate, 200, b => b.success);

  const saSubCancel = await req('PATCH', `/api/superadmin/subscriptions/${newSubId}/cancel`, {}, SA2);
  check('PATCH /superadmin/subscriptions/:id/cancel - cancel subscription', saSubCancel, 200, b => b.success);

  // REGISTER NEW ORG
  console.log('\n>> REGISTER NEW ORGANISATION');
  const uniqueEmail = `testorg_${Date.now()}@nexusevents.test`;
  const register = await req('POST', '/api/auth/register', {
    orgName: 'Nexus Events Group',
    category: 'events',
    email: uniqueEmail,
    phone: '+1-555-0300',
    password: 'NexusTest@123',
  });
  check('POST /auth/register - new org with 14-day trial', register, 201,
    b => b.data && b.data.accessToken && b.data.organisation && b.data.organisation.name === 'Nexus Events Group');
  if (register.body && register.body.data && register.body.data.organisation) {
    console.log('     org status: ' + register.body.data.organisation.status);
    console.log('     message: ' + register.body.message);
  }

  const dupReg = await req('POST', '/api/auth/register', {
    orgName: 'Dup Org', email: uniqueEmail, password: 'Test@123',
  });
  check('POST /auth/register - duplicate email returns 409', dupReg, 409);

  // SOFT DELETE
  console.log('\n>> SOFT DELETE & CLEANUP');
  const mDel = await req('DELETE', `/api/maintenance/${mId}`, null, ORG);
  check('DELETE /maintenance/:id - delete schedule', mDel, 200, b => b.success);

  const custDel = await req('DELETE', `/api/customers/${custId}`, null, ORG);
  check('DELETE /customers/:id - soft deactivate customer', custDel, 200, b => b.success);

  const eqDel = await req('DELETE', `/api/equipment/${eqId}`, null, ORG);
  check('DELETE /equipment/:id - soft delete equipment', eqDel, 200, b => b.success);

  const eqGone = await req('GET', `/api/equipment/${eqId}`, null, ORG);
  check('GET /equipment/:id after soft delete - returns 404', eqGone, 404);

  const catDel = await req('DELETE', `/api/categories/${catId}`, null, ORG);
  check('DELETE /categories/:id - delete category', catDel, 200, b => b.success);

  // FINAL SUMMARY
  const total = pass + fail;
  const score = Math.round((pass / total) * 100);
  console.log('\n================================================');
  console.log('  FINAL RESULTS');
  console.log('================================================');
  console.log('  PASSED  : ' + pass + ' / ' + total);
  console.log('  FAILED  : ' + fail + ' / ' + total);
  console.log('  SCORE   : ' + score + '%');
  console.log('================================================\n');

  if (fail > 0) {
    console.log('FAILED TESTS:');
    failures.forEach(f => console.log(f));
  } else {
    console.log('All tests passed!');
  }
}

run().catch(err => {
  console.error('Test runner crashed:', err.message);
  process.exit(1);
});
