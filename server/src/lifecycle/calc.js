/**
 * Shared money/document helpers for the quote -> order -> invoice lifecycle.
 * Totals are always recomputed on the server from line items so the client
 * can never submit an inconsistent total.
 */

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Normalize a single line item and compute its amount. */
export function normalizeLine(line = {}) {
  const qty = Number(line.qty) || 1;
  const days = Number(line.days) || 1;
  const rate = Number(line.rate) || 0;
  const amount = round2(qty * days * rate);
  return {
    equipmentId: line.equipmentId || null,
    description: line.description || '',
    qty,
    days,
    rate: round2(rate),
    amount,
  };
}

/**
 * Recompute subtotal / tax / total from raw line items.
 * @param {object} doc partial doc with lineItems, taxRate, discount
 */
export function computeTotals(doc = {}) {
  const lineItems = (doc.lineItems || []).map(normalizeLine);
  const subtotal = round2(lineItems.reduce((s, l) => s + l.amount, 0));
  const discount = round2(doc.discount || 0);
  const taxRate = Number(doc.taxRate) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = round2(taxable * taxRate);
  const total = round2(taxable + taxAmount);
  return { lineItems, subtotal, discount, taxRate, taxAmount, total };
}

let seq = 1000;
/** Human-friendly document numbers, e.g. QT-1001 / SO-2001 / INV-3001. */
export function docNumber(prefix) {
  seq += 1;
  return `${prefix}-${seq}`;
}
