/**
 * Quote -> Order -> Invoice -> Return/Charges lifecycle.
 *
 * Every monetary total is recomputed server-side from line items. Status
 * transitions are validated. PDF generation and emailing are exposed per doc.
 */
import { Router } from 'express';
import { db, list, find, insert, update, remove, nextId } from '../store.js';
import { authenticate, tenantScope } from '../auth.js';
import { computeTotals, docNumber } from '../lifecycle/calc.js';
import { renderDocumentPdf } from '../lifecycle/pdf.js';
import { sendEmail, isEmailConfigured } from '../lifecycle/email.js';

const router = Router();
router.use(authenticate);

const orgOf = (req) => (req.user.role === 'superadmin' ? req.body.orgId || tenantScope(req) : req.user.orgId);
const customerOf = (orgId, id) => db.companies.find((c) => c.id === id) || {};
const orgRecord = (orgId) => db.organizations.find((o) => o.id === orgId) || {};

/* ----------------------------- QUOTATIONS ----------------------------- */

router.get('/quotations', (req, res) => res.json(list('quotations', tenantScope(req))));

router.get('/quotations/:id', (req, res) => {
  const row = find('quotations', req.params.id, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Quotation not found' });
  res.json(row);
});

router.post('/quotations', (req, res) => {
  const orgId = orgOf(req);
  if (!orgId) return res.status(400).json({ error: 'orgId is required' });
  const totals = computeTotals(req.body);
  const row = insert('quotations', {
    ...req.body, ...totals,
    id: nextId('quote'),
    number: req.body.number || docNumber('QT'),
    orgId,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(row);
});

router.put('/quotations/:id', (req, res) => {
  const { id: _i, orgId: _o, createdAt: _c, ...patch } = req.body || {};
  if (patch.lineItems || patch.taxRate !== undefined || patch.discount !== undefined) {
    const existing = find('quotations', req.params.id, tenantScope(req));
    Object.assign(patch, computeTotals({ ...existing, ...patch }));
  }
  const row = update('quotations', req.params.id, patch, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Quotation not found' });
  res.json(row);
});

router.delete('/quotations/:id', (req, res) => {
  const ok = remove('quotations', req.params.id, tenantScope(req));
  if (!ok) return res.status(404).json({ error: 'Quotation not found' });
  res.status(204).end();
});

// Transition: mark sent / accepted / rejected
router.post('/quotations/:id/status', (req, res) => {
  const allowed = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  const row = update('quotations', req.params.id, { status: req.body.status }, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Quotation not found' });
  res.json(row);
});

// Convert an accepted quote into a confirmed order
router.post('/quotations/:id/convert', (req, res) => {
  const quote = find('quotations', req.params.id, tenantScope(req));
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });
  if (quote.convertedOrderId) return res.status(409).json({ error: 'Quotation already converted', orderId: quote.convertedOrderId });
  const totals = computeTotals(quote);
  const order = insert('orders', {
    ...totals,
    id: nextId('order'),
    number: docNumber('SO'),
    orgId: quote.orgId,
    quotationId: quote.id,
    customerId: quote.customerId,
    startDate: req.body.startDate || quote.issueDate,
    endDate: req.body.endDate || quote.validUntil,
    status: 'confirmed',
    notes: `Converted from ${quote.number}`,
    createdAt: new Date().toISOString(),
  });
  update('quotations', quote.id, { status: 'accepted', convertedOrderId: order.id }, tenantScope(req));
  res.status(201).json(order);
});

/* ------------------------------- ORDERS ------------------------------- */

router.get('/orders', (req, res) => res.json(list('orders', tenantScope(req))));
router.get('/orders/:id', (req, res) => {
  const row = find('orders', req.params.id, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

router.post('/orders', (req, res) => {
  const orgId = orgOf(req);
  if (!orgId) return res.status(400).json({ error: 'orgId is required' });
  const totals = computeTotals(req.body);
  const row = insert('orders', {
    ...req.body, ...totals,
    id: nextId('order'),
    number: req.body.number || docNumber('SO'),
    orgId,
    status: req.body.status || 'confirmed',
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(row);
});

router.put('/orders/:id', (req, res) => {
  const { id: _i, orgId: _o, createdAt: _c, ...patch } = req.body || {};
  if (patch.lineItems || patch.taxRate !== undefined || patch.discount !== undefined) {
    const existing = find('orders', req.params.id, tenantScope(req));
    Object.assign(patch, computeTotals({ ...existing, ...patch }));
  }
  const row = update('orders', req.params.id, patch, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

router.delete('/orders/:id', (req, res) => {
  const ok = remove('orders', req.params.id, tenantScope(req));
  if (!ok) return res.status(404).json({ error: 'Order not found' });
  res.status(204).end();
});

router.post('/orders/:id/status', (req, res) => {
  const allowed = ['confirmed', 'fulfilled', 'returned', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  const row = update('orders', req.params.id, { status: req.body.status }, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

// Generate an invoice from an order
router.post('/orders/:id/invoice', (req, res) => {
  const order = find('orders', req.params.id, tenantScope(req));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.invoiceId) return res.status(409).json({ error: 'Invoice already exists', invoiceId: order.invoiceId });
  const totals = computeTotals(order);
  const now = new Date();
  const due = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const invoice = insert('invoices', {
    ...totals,
    id: nextId('inv'),
    number: docNumber('INV'),
    orgId: order.orgId,
    orderId: order.id,
    customerId: order.customerId,
    issueDate: now.toISOString(),
    dueDate: req.body.dueDate || due.toISOString(),
    status: 'unpaid',
    amountPaid: 0,
    notes: req.body.notes || 'Net 30.',
    createdAt: now.toISOString(),
  });
  update('orders', order.id, { invoiceId: invoice.id }, tenantScope(req));
  res.status(201).json(invoice);
});

/* ------------------------------ INVOICES ------------------------------ */

router.get('/invoices', (req, res) => res.json(list('invoices', tenantScope(req))));
router.get('/invoices/:id', (req, res) => {
  const row = find('invoices', req.params.id, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  res.json(row);
});

router.post('/invoices', (req, res) => {
  const orgId = orgOf(req);
  if (!orgId) return res.status(400).json({ error: 'orgId is required' });
  const totals = computeTotals(req.body);
  const row = insert('invoices', {
    ...req.body, ...totals,
    id: nextId('inv'),
    number: req.body.number || docNumber('INV'),
    orgId,
    status: req.body.status || 'unpaid',
    amountPaid: req.body.amountPaid || 0,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(row);
});

router.put('/invoices/:id', (req, res) => {
  const { id: _i, orgId: _o, createdAt: _c, ...patch } = req.body || {};
  if (patch.lineItems || patch.taxRate !== undefined || patch.discount !== undefined) {
    const existing = find('invoices', req.params.id, tenantScope(req));
    Object.assign(patch, computeTotals({ ...existing, ...patch }));
  }
  const row = update('invoices', req.params.id, patch, tenantScope(req));
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  res.json(row);
});

router.delete('/invoices/:id', (req, res) => {
  const ok = remove('invoices', req.params.id, tenantScope(req));
  if (!ok) return res.status(404).json({ error: 'Invoice not found' });
  res.status(204).end();
});

// Record a payment (full or partial)
router.post('/invoices/:id/pay', (req, res) => {
  const inv = find('invoices', req.params.id, tenantScope(req));
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const amount = req.body.amount !== undefined ? Number(req.body.amount) : (inv.total - (inv.amountPaid || 0));
  const amountPaid = Math.min(inv.total, (inv.amountPaid || 0) + amount);
  const status = amountPaid >= inv.total ? 'paid' : 'partial';
  const row = update('invoices', inv.id, {
    amountPaid,
    status,
    paidDate: status === 'paid' ? new Date().toISOString() : inv.paidDate,
  }, tenantScope(req));
  res.json(row);
});

/* ----------------- RETURN & CHARGES (settlement) ---------------------- */
// Close out an order: mark returned, optionally add late/damage penalties.
router.post('/orders/:id/return', (req, res) => {
  const order = find('orders', req.params.id, tenantScope(req));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  update('orders', order.id, { status: 'returned', returnedDate: new Date().toISOString() }, tenantScope(req));

  const charges = [];
  const { lateDays = 0, lateRatePerDay = 0, damageAmount = 0, damageNote = '' } = req.body || {};
  if (lateDays > 0 && lateRatePerDay > 0) {
    charges.push(insert('penalties', {
      id: nextId('penalty'), orgId: order.orgId, rentalId: order.id, type: 'late-return',
      amount: Math.round(lateDays * lateRatePerDay * 100) / 100, daysOverdue: lateDays,
      description: `Late return: ${lateDays} day(s) x $${lateRatePerDay}/day`,
      status: 'pending', createdAt: new Date().toISOString(),
    }));
  }
  if (damageAmount > 0) {
    charges.push(insert('penalties', {
      id: nextId('penalty'), orgId: order.orgId, rentalId: order.id, type: 'damage',
      amount: Math.round(damageAmount * 100) / 100,
      description: damageNote || 'Damage charge', status: 'pending', createdAt: new Date().toISOString(),
    }));
  }
  res.json({ order: find('orders', order.id, tenantScope(req)), charges });
});

/* ----------------------------- PDF + EMAIL ---------------------------- */

const collForKind = { quotation: 'quotations', invoice: 'invoices' };
const labelForKind = { quotation: 'QUOTATION', invoice: 'INVOICE' };

async function buildPdf(kind, doc) {
  const org = orgRecord(doc.orgId);
  const customer = customerOf(doc.orgId, doc.customerId);
  return renderDocumentPdf({ kind: labelForKind[kind], doc, org, customer });
}

// GET /:kind/:id/pdf  -> streams a PDF
router.get('/:kind/:id/pdf', async (req, res) => {
  const kind = req.params.kind;
  const coll = collForKind[kind];
  if (!coll) return res.status(404).json({ error: 'Unsupported document type' });
  const doc = find(coll, req.params.id, tenantScope(req));
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  try {
    const buf = await buildPdf(kind, doc);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.number || doc.id}.pdf"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: 'PDF generation failed: ' + err.message });
  }
});

// POST /:kind/:id/email  -> emails the document with a PDF attachment
router.post('/:kind/:id/email', async (req, res) => {
  const kind = req.params.kind;
  const coll = collForKind[kind];
  if (!coll) return res.status(404).json({ error: 'Unsupported document type' });
  const doc = find(coll, req.params.id, tenantScope(req));
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const customer = customerOf(doc.orgId, doc.customerId);
  const to = req.body.to || customer.email || (customer.contact && customer.contact.email);
  if (!to) return res.status(400).json({ error: 'No recipient email available' });

  const org = orgRecord(doc.orgId);
  const label = labelForKind[kind];
  const subject = req.body.subject || `${label === 'INVOICE' ? 'Invoice' : 'Quotation'} ${doc.number} from ${org.name || 'EquipTrack'}`;
  const bodyText = req.body.message ||
    `Dear ${customer.name || 'Customer'},\n\nPlease find attached ${label.toLowerCase()} ${doc.number} for a total of $${(doc.total || 0).toFixed(2)}.\n\nThank you for your business.\n${org.name || 'EquipTrack Pro'}`;
  const html = `<p>Dear ${customer.name || 'Customer'},</p><p>Please find attached <strong>${label.toLowerCase()} ${doc.number}</strong> for a total of <strong>$${(doc.total || 0).toFixed(2)}</strong>.</p><p>Thank you for your business.<br/>${org.name || 'EquipTrack Pro'}</p>`;

  try {
    const pdf = await buildPdf(kind, doc);
    const result = await sendEmail({
      orgId: doc.orgId, to, subject, text: bodyText, html,
      attachments: [{ filename: `${doc.number || doc.id}.pdf`, content: pdf }],
    });
    // Auto-advance a draft quote to "sent" once emailed.
    if (kind === 'quotation' && doc.status === 'draft') {
      update('quotations', doc.id, { status: 'sent' }, tenantScope(req));
    }
    res.json({ ...result, to, smtpConfigured: isEmailConfigured() });
  } catch (err) {
    res.status(502).json({ error: 'Email send failed: ' + err.message });
  }
});

// Visibility into what was emailed
router.get('/email-log', (req, res) => res.json(list('emailLog', tenantScope(req))));

export default router;
