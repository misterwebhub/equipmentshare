'use client';

/**
 * Reusable line-item editor + live totals for sales documents
 * (quotations, orders, invoices).
 *
 * Totals shown here are an optimistic client preview only — the server
 * recomputes every total from line items on save, so the persisted document
 * is always authoritative.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { LineItem } from '@/lib/api';

export interface LineItemsValue {
  lineItems: LineItem[];
  discount: number;
  taxRate: number;
}

interface EquipmentOption {
  id: string;
  name: string;
  fixedRate?: number;
  hourlyRate?: number;
}

interface Props {
  value: LineItemsValue;
  onChange: (value: LineItemsValue) => void;
  equipment?: EquipmentOption[];
  readOnly?: boolean;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n: number) => `$${round2(n).toFixed(2)}`;

function lineAmount(li: LineItem) {
  return round2((Number(li.qty) || 0) * (Number(li.days) || 0) * (Number(li.rate) || 0));
}

export function computePreviewTotals(v: LineItemsValue) {
  const subtotal = round2((v.lineItems || []).reduce((s, li) => s + lineAmount(li), 0));
  const discount = round2(v.discount || 0);
  const taxable = Math.max(0, subtotal - discount);
  const taxRate = Number(v.taxRate) || 0;
  const taxAmount = round2(taxable * (taxRate / 100));
  const total = round2(taxable + taxAmount);
  return { subtotal, discount, taxRate, taxAmount, total };
}

const emptyLine: LineItem = { description: '', qty: 1, days: 1, rate: 0 };

export function LineItemsEditor({ value, onChange, equipment = [], readOnly = false }: Props) {
  const totals = computePreviewTotals(value);

  const setLine = (idx: number, patch: Partial<LineItem>) => {
    const lineItems = value.lineItems.map((li, i) => (i === idx ? { ...li, ...patch } : li));
    onChange({ ...value, lineItems });
  };

  const addLine = () => onChange({ ...value, lineItems: [...value.lineItems, { ...emptyLine }] });
  const removeLine = (idx: number) =>
    onChange({ ...value, lineItems: value.lineItems.filter((_, i) => i !== idx) });

  const pickEquipment = (idx: number, equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    setLine(idx, {
      equipmentId,
      description: eq?.name || value.lineItems[idx].description,
      rate: eq?.fixedRate ?? eq?.hourlyRate ?? value.lineItems[idx].rate,
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Item</th>
              <th className="px-3 py-2 text-right font-medium w-16">Qty</th>
              <th className="px-3 py-2 text-right font-medium w-16">Days</th>
              <th className="px-3 py-2 text-right font-medium w-24">Rate</th>
              <th className="px-3 py-2 text-right font-medium w-24">Amount</th>
              {!readOnly && <th className="px-2 py-2 w-10" />}
            </tr>
          </thead>
          <tbody>
            {value.lineItems.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-3 py-6 text-center text-muted-foreground">
                  No line items yet.
                </td>
              </tr>
            )}
            {value.lineItems.map((li, idx) => (
              <tr key={idx} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  {!readOnly && equipment.length > 0 && (
                    <Select
                      value={li.equipmentId || ''}
                      onValueChange={(v) => pickEquipment(idx, v)}
                    >
                      <SelectTrigger className="mb-2 h-8 bg-card border-border">
                        <SelectValue placeholder="Pick equipment (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {readOnly ? (
                    <span className="text-foreground">{li.description}</span>
                  ) : (
                    <Input
                      value={li.description}
                      onChange={(e) => setLine(idx, { description: e.target.value })}
                      placeholder="Description"
                      className="h-8 bg-card border-border"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {readOnly ? li.qty : (
                    <Input type="number" min={0} value={li.qty}
                      onChange={(e) => setLine(idx, { qty: Number(e.target.value) })}
                      className="h-8 w-16 bg-card border-border text-right" />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {readOnly ? li.days : (
                    <Input type="number" min={0} value={li.days}
                      onChange={(e) => setLine(idx, { days: Number(e.target.value) })}
                      className="h-8 w-16 bg-card border-border text-right" />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {readOnly ? money(li.rate) : (
                    <Input type="number" min={0} step="0.01" value={li.rate}
                      onChange={(e) => setLine(idx, { rate: Number(e.target.value) })}
                      className="h-8 w-24 bg-card border-border text-right" />
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium text-foreground">
                  {money(lineAmount(li))}
                </td>
                {!readOnly && (
                  <td className="px-2 py-2 text-right">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => removeLine(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" className="border-border" onClick={addLine}>
          <Plus className="mr-2 h-4 w-4" /> Add line item
        </Button>
      )}

      <div className="ml-auto w-full max-w-xs space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{money(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          {readOnly ? (
            <span className="font-medium text-foreground">{money(totals.discount)}</span>
          ) : (
            <Input type="number" min={0} step="0.01" value={value.discount}
              onChange={(e) => onChange({ ...value, discount: Number(e.target.value) })}
              className="h-8 w-28 bg-card border-border text-right" />
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax rate (%)</span>
          {readOnly ? (
            <span className="font-medium text-foreground">{totals.taxRate}%</span>
          ) : (
            <Input type="number" min={0} step="0.01" value={value.taxRate}
              onChange={(e) => onChange({ ...value, taxRate: Number(e.target.value) })}
              className="h-8 w-28 bg-card border-border text-right" />
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-medium text-foreground">{money(totals.taxAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-base">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-foreground">{money(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}
