/**
 * In-memory data store.
 *
 * This is the single source of truth for the API. Each top-level array maps
 * 1:1 to a MySQL table (see server/SCHEMA.sql for the equivalent DDL). Swapping
 * to a real DB means replacing the helper functions below with SQL queries —
 * the route handlers only ever talk to these helpers, never to the arrays
 * directly, so the surface area for that migration is small.
 */

export const db = {
  organizations: [],
  subscriptions: [],
  users: [],
  companies: [], // customers / partner companies, scoped per org
  people: [], // operators / staff scoped per org
  equipment: [],
  projects: [],
  rentals: [],
  maintenance: [],
  conditionReports: [],
  deliveries: [],
  notifications: [],
  penalties: [],
  tickets: [],
  calendarEvents: [],
  quotations: [], // sales quotes scoped per org
  orders: [], // confirmed rental orders/bookings
  invoices: [], // invoices generated from orders
  emailLog: [], // record of every email send attempt
  plans: [],
};

let counter = 1000;
export function nextId(prefix) {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Generic CRUD helpers. All accept an optional orgId filter for tenancy. */
export function list(collection, orgId) {
  const rows = db[collection] || [];
  if (orgId === undefined) return rows;
  return rows.filter((r) => r.orgId === orgId);
}

export function find(collection, id, orgId) {
  const row = (db[collection] || []).find((r) => r.id === id);
  if (!row) return null;
  if (orgId !== undefined && row.orgId !== orgId) return null;
  return row;
}

export function insert(collection, data) {
  db[collection].push(data);
  return data;
}

export function update(collection, id, patch, orgId) {
  const row = find(collection, id, orgId);
  if (!row) return null;
  Object.assign(row, patch, { updatedAt: new Date().toISOString() });
  return row;
}

export function remove(collection, id, orgId) {
  const idx = db[collection].findIndex(
    (r) => r.id === id && (orgId === undefined || r.orgId === orgId)
  );
  if (idx === -1) return false;
  db[collection].splice(idx, 1);
  return true;
}
