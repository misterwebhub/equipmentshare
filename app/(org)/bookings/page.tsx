'use client';
import { useState, useEffect } from 'react';
import { useBookings, useBookingById } from '@/hooks/use-bookings';
import { useEquipment } from '@/hooks/use-equipment';
import { useCustomers } from '@/hooks/use-customers';
import { useEquipmentUnits, useAvailableUnits } from '@/hooks/use-equipment-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, CalendarDays, Eye, Trash2, FileText, Package,
  CheckCircle2, Clock, Wrench, AlertTriangle, User, Calendar,
  Tag, ArrowRightCircle, ChevronDown, Info,
} from 'lucide-react';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface LineItem {
  _key: string;
  equipment_id: string;
  unit_ids: string[];          // multi-SKU selection
  description: string;
  pricing_type: string;
  unit_rate: string;
  quantity: string;            // auto-derived from unit_ids.length when > 0
}

const PRICING_LABELS: Record<string, string> = {
  fixed: 'Fixed (one-time)', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', hourly: 'Hourly',
};
const PRICING_SHORT: Record<string, string> = {
  fixed: 'Fixed', daily: '/ day', weekly: '/ wk', monthly: '/ mo', hourly: '/ hr',
};

const STATUS_META: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#10b981' },
  pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: '#f59e0b' },
  completed: { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/30',     dot: '#0ea5e9' },
  overdue:   { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30',    dot: '#f43f5e' },
  cancelled: { bg: 'bg-zinc-500/10',    text: 'text-zinc-400',    border: 'border-zinc-500/30',    dot: '#71717a' },
};

function statusCls(s: string) {
  const m = STATUS_META[s] || STATUS_META.pending;
  return `${m.bg} ${m.text} ${m.border}`;
}

/* ─── Multi-SKU Line Item Row ────────────────────────────────────────── */
function LineItemRow({
  item, index, allEquipment, startDate, endDate, onChange, onRemove, canRemove,
}: {
  item: LineItem; index: number;
  allEquipment: Record<string, unknown>[];
  startDate: string; endDate: string;
  onChange: (key: string, field: keyof LineItem | 'unit_ids', val: string | string[]) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}) {
  const { units: allUnits } = useEquipmentUnits(item.equipment_id || null);
  const { data: availUnits = [] } = useAvailableUnits(item.equipment_id || null, startDate, endDate);
  const availIds = new Set(availUnits.map((u: Record<string, unknown>) => u.id as string));

  // Effective quantity: if units selected → count of units, else manual qty
  const effectiveQty = item.unit_ids.length > 0 ? item.unit_ids.length : (parseFloat(item.quantity) || 1);
  const lineTotal = (parseFloat(item.unit_rate) || 0) * effectiveQty;

  const handleEquipmentChange = (id: string) => {
    const eq = allEquipment.find(e => e.id === id);
    onChange(item._key, 'equipment_id', id);
    onChange(item._key, 'unit_ids', []);
    if (eq) {
      const pt = (eq.pricing_type as string) === 'hourly' ? 'hourly' : 'daily';
      onChange(item._key, 'pricing_type', pt);
      onChange(item._key, 'unit_rate', pt === 'hourly' ? String(eq.hourly_rate ?? '') : String(eq.fixed_rate ?? ''));
    }
  };

  const toggleUnit = (uid: string) => {
    const next = item.unit_ids.includes(uid)
      ? item.unit_ids.filter(x => x !== uid)
      : [...item.unit_ids, uid];
    onChange(item._key, 'unit_ids', next);
  };

  /* ── Auto-calculate quantity from date range based on pricing type ── */
  useEffect(() => {
    if (!startDate || !endDate || !item.equipment_id) return;
    if (item.unit_ids.length > 0) return; // SKU count overrides
    const days = Math.max(1, Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
    ));
    let autoQty: number | null = null;
    if (item.pricing_type === 'daily')   autoQty = days;
    else if (item.pricing_type === 'weekly')  autoQty = Math.max(1, Math.ceil(days / 7));
    else if (item.pricing_type === 'monthly') autoQty = Math.max(1, Math.ceil(days / 30));
    // fixed → manual qty;  hourly → manual hours
    if (autoQty !== null) onChange(item._key, 'quantity', String(autoQty));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, item.pricing_type, item.equipment_id]);

  /* Cost breakdown label */
  const dateQtyLabel = (() => {
    if (!startDate || !endDate || !item.equipment_id) return null;
    const days = Math.max(1, Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
    ));
    if (item.pricing_type === 'daily')   return `${days} day${days !== 1 ? 's' : ''}`;
    if (item.pricing_type === 'weekly')  { const w = Math.max(1, Math.ceil(days / 7)); return `${w} week${w !== 1 ? 's' : ''} (${days}d)`; }
    if (item.pricing_type === 'monthly') { const m = Math.max(1, Math.ceil(days / 30)); return `${m} month${m !== 1 ? 's' : ''} (${days}d)`; }
    return null;
  })();

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden">
      {/* Line number accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: `oklch(0.70 0.28 ${270 + index * 30})` }} />

      <div className="pl-4 pr-4 py-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center text-white"
              style={{ background: `oklch(0.70 0.28 ${270 + index * 30})` }}>
              {index + 1}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Line Item</span>
          </div>
          {canRemove && (
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all"
              onClick={() => onRemove(item._key)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Equipment + Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Equipment *</Label>
            <Select value={item.equipment_id} onValueChange={handleEquipmentChange}>
              <SelectTrigger className="h-10 bg-background border-border/80 focus:ring-1 focus:ring-violet-500/40">
                <Package className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                <SelectValue placeholder="Select equipment…" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allEquipment.map(e => (
                  <SelectItem key={e.id as string} value={e.id as string}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{e.name as string}</span>
                      {Number(e.available_units) > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                          {Number(e.available_units)} free
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Description / Notes</Label>
            <Input className="h-10 bg-background border-border/80" placeholder="Optional line description…"
              value={item.description} onChange={e => onChange(item._key, 'description', e.target.value)} />
          </div>
        </div>

        {/* SKU Multi-selector */}
        {item.equipment_id && (allUnits as unknown[]).length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-3.5 w-3.5 text-violet-400" />
                Select Units (SKU)
                <span className="text-[10px] font-normal text-muted-foreground/60 ml-1">— click to select multiple</span>
              </Label>
              <div className="flex items-center gap-2">
                {startDate && endDate && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    {availIds.size} available on dates
                  </span>
                )}
                {item.unit_ids.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
                    {item.unit_ids.length} selected
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(allUnits as Record<string, unknown>[]).map((u) => {
                const uid = u.id as string;
                const sku = u.sku_code as string;
                const st  = u.status as string;
                const datesSet = !!(startDate && endDate);
                const isAvail    = datesSet ? availIds.has(uid) : (st === 'available');
                const isSelected = item.unit_ids.includes(uid);
                const isDisabled = !isSelected && !isAvail;

                let chipClass = '';
                let chipStyle: React.CSSProperties = {};
                if (isSelected) {
                  chipStyle = { background: 'linear-gradient(135deg, oklch(0.70 0.28 270 / 0.25), oklch(0.78 0.22 195 / 0.2))', borderColor: 'oklch(0.70 0.28 270 / 0.8)', color: 'oklch(0.85 0.20 270)' };
                } else if (isDisabled) {
                  chipClass = 'opacity-40 cursor-not-allowed';
                  chipStyle = { borderColor: 'oklch(0.5 0 0 / 0.2)', color: 'oklch(0.55 0 0)' };
                } else {
                  chipStyle = { borderColor: 'oklch(0.76 0.22 155 / 0.5)', color: 'oklch(0.76 0.22 155)', background: 'oklch(0.76 0.22 155 / 0.08)' };
                }

                const StatusIcon = st === 'maintenance' ? Wrench : st === 'damaged' ? AlertTriangle : st === 'rented-out' ? Clock : CheckCircle2;

                return (
                  <button key={uid} type="button" disabled={isDisabled}
                    onClick={() => toggleUnit(uid)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all duration-150 ${chipClass} ${isSelected ? 'shadow-sm scale-105' : 'hover:scale-102'}`}
                    style={chipStyle}
                    title={`${sku} · ${st}${isSelected ? ' (selected)' : ''}`}>
                    {isSelected ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                    ) : (
                      <StatusIcon className="h-3 w-3 shrink-0 opacity-60" />
                    )}
                    {sku}
                  </button>
                );
              })}
            </div>
            {/* Selected SKUs summary */}
            {item.unit_ids.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex flex-wrap gap-1">
                  {item.unit_ids.map(uid => {
                    const u = (allUnits as Record<string, unknown>[]).find(x => x.id === uid);
                    return u ? (
                      <span key={uid} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'oklch(0.70 0.28 270 / 0.2)', color: 'oklch(0.85 0.20 270)' }}>
                        ✓ {u.sku_code as string}
                      </span>
                    ) : null;
                  })}
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  Qty auto-set to <strong>{item.unit_ids.length}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pricing row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Pricing Type</Label>
            <Select value={item.pricing_type} onValueChange={v => onChange(item._key, 'pricing_type', v)}>
              <SelectTrigger className="h-10 bg-background border-border/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRICING_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Rate ($){item.pricing_type !== 'fixed' && <span className="text-muted-foreground/60 ml-1">/ {item.pricing_type}</span>}
            </Label>
            <Input className="h-10 bg-background border-border/80 font-mono" type="number" min="0" step="0.01" placeholder="0.00"
              value={item.unit_rate} onChange={e => onChange(item._key, 'unit_rate', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {item.pricing_type === 'fixed' ? 'Qty' : item.pricing_type === 'hourly' ? 'Hours' : 'Qty (auto)'}
              {item.unit_ids.length > 0 && (
                <span title="Auto from selected SKUs" className="text-[10px] text-violet-400">(SKUs)</span>
              )}
            </Label>
            <Input className="h-10 bg-background border-border/80 font-mono" type="number" min="1" step="1" placeholder="1"
              value={item.unit_ids.length > 0 ? String(item.unit_ids.length) : item.quantity}
              readOnly={item.unit_ids.length > 0 || (['daily','weekly','monthly'].includes(item.pricing_type) && !!startDate && !!endDate)}
              onChange={e => {
                if (item.unit_ids.length === 0 && !(['daily','weekly','monthly'].includes(item.pricing_type) && startDate && endDate))
                  onChange(item._key, 'quantity', e.target.value);
              }}
              style={(item.unit_ids.length > 0 || (['daily','weekly','monthly'].includes(item.pricing_type) && !!startDate && !!endDate))
                ? { opacity: 0.75, cursor: 'not-allowed', background: 'oklch(0.70 0.28 270 / 0.06)' } : {}} />
            {/* Date-range cost breakdown hint */}
            {dateQtyLabel && (parseFloat(item.unit_rate) || 0) > 0 && (
              <p className="text-[10px] font-medium" style={{ color: 'oklch(0.72 0.22 195)' }}>
                {dateQtyLabel} × ${parseFloat(item.unit_rate).toFixed(2)} = <strong>${lineTotal.toFixed(2)}</strong>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Line Total</Label>
            <div className="h-10 flex items-center px-3 rounded-lg border border-border/60 bg-muted/30 font-bold font-mono text-sm"
              style={{ color: lineTotal > 0 ? 'oklch(0.78 0.22 195)' : undefined }}>
              ${lineTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
const EMPTY_HEADER = {
  customer_id: '', assigned_user_id: '',
  start_date: '', end_date: '',
  security_deposit: '0', discount: '0', tax_rate: '0', notes: '', status: 'pending',
  is_quotation: false, quotation_expires_at: '',
};

function newLine(): LineItem {
  return {
    _key: Math.random().toString(36).slice(2),
    equipment_id: '', unit_ids: [], description: '',
    pricing_type: 'daily', unit_rate: '', quantity: '1',
  };
}

export default function BookingsPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [open, setOpen]           = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [header, setHeader]       = useState(EMPTY_HEADER);
  const [lines, setLines]         = useState<LineItem[]>([newLine()]);
  const qc = useQueryClient();

  const { bookings, isLoading, createMutation, updateStatusMutation } = useBookings({ search, status: statusFilter });
  const { data: invoiceDetail, isLoading: invoiceLoading } = useBookingById(viewingId);
  const { equipment } = useEquipment();
  const { customers } = useCustomers();

  const allEquipment = (equipment as Record<string, unknown>[]).filter(e => e.status !== 'retired');

  /* Running totals */
  const subtotal   = lines.reduce((s, l) => {
    const qty = l.unit_ids.length > 0 ? l.unit_ids.length : (parseFloat(l.quantity) || 1);
    return s + (parseFloat(l.unit_rate) || 0) * qty;
  }, 0);
  const discount   = parseFloat(header.discount) || 0;
  const taxRate    = parseFloat(header.tax_rate) || 0;
  const taxAmt     = ((subtotal - discount) * taxRate) / 100;
  const deposit    = parseFloat(header.security_deposit) || 0;
  const grandTotal = Math.max(0, subtotal - discount + taxAmt);

  const setH = (k: keyof typeof EMPTY_HEADER) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setHeader(p => ({ ...p, [k]: e.target.value }));

  const updateLine = (key: string, field: keyof LineItem | 'unit_ids', val: string | string[]) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: val } : l));

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key));

  const handleCreate = () => {
    const items = lines.filter(l => l.equipment_id).map(l => ({
      equipment_id: l.equipment_id,
      unit_ids: l.unit_ids,
      equipment_unit_id: l.unit_ids[0] || undefined,
      description: l.description,
      pricing_type: l.pricing_type,
      unit_rate: parseFloat(l.unit_rate) || 0,
      quantity: l.unit_ids.length > 0 ? l.unit_ids.length : (parseFloat(l.quantity) || 1),
    }));
    createMutation.mutate(
      { ...header, items, estimated_cost: grandTotal, discount, tax_rate: taxRate,
        is_quotation: header.is_quotation, quotation_expires_at: header.quotation_expires_at || undefined } as never,
      { onSuccess: () => { setOpen(false); setHeader(EMPTY_HEADER); setLines([newLine()]); } }
    );
  };

  const handleConvertQuotation = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/convert`, {});
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', id] });
      toast.success('Quotation converted to booking!');
      setViewingId(null);
    } catch { toast.error('Failed to convert quotation'); }
  };

  const canCreate = !!(header.customer_id && header.start_date && header.end_date && lines.some(l => l.equipment_id));

  const filtered = (bookings as Record<string, unknown>[]).filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.equipment_names as string)?.toLowerCase().includes(q)
        || (b.customer_name as string)?.toLowerCase().includes(q)
        || (b.invoice_number as string)?.toLowerCase().includes(q);
    }
    return true;
  });

  /* Status summary counts */
  const statusCounts = (['pending','active','overdue','completed'] as const).map(s => ({
    s, count: (bookings as Record<string,unknown>[]).filter(b => b.status === s && !b.is_quotation).length,
  }));
  const quotationCount = (bookings as Record<string,unknown>[]).filter(b => b.is_quotation).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Bookings & Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(bookings as unknown[]).length} records
            {quotationCount > 0 && <span className="ml-2 text-amber-400">· {quotationCount} quotations</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-2"
            onClick={() => { setHeader({ ...EMPTY_HEADER, is_quotation: true }); setLines([newLine()]); setOpen(true); }}>
            <FileText className="h-4 w-4" />New Quotation
          </Button>
          <Button className="gap-2"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.28 270), oklch(0.55 0.28 300))' }}
            onClick={() => { setHeader(EMPTY_HEADER); setLines([newLine()]); setOpen(true); }}>
            <Plus className="h-4 w-4" />New Booking
          </Button>
        </div>
      </div>

      {/* ── Status tiles ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusCounts.map(({ s, count }) => {
          const m = STATUS_META[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatus(active ? 'all' : s)}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${active ? `${m.bg} ${m.border}` : 'border-border/60 hover:border-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
                <p className={`text-xs font-medium capitalize ${active ? m.text : 'text-muted-foreground'}`}>{s}</p>
              </div>
              <p className={`text-2xl font-bold ${active ? m.text : ''}`}>{count}</p>
            </button>
          );
        })}
        <button onClick={() => setStatus(statusFilter === 'quotation' ? 'all' : 'quotation')}
          className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${statusFilter === 'quotation' ? 'bg-amber-500/10 border-amber-500/40' : 'border-border/60 hover:border-border'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3 w-3 text-amber-400" />
            <p className={`text-xs font-medium ${statusFilter === 'quotation' ? 'text-amber-400' : 'text-muted-foreground'}`}>Quotations</p>
          </div>
          <p className={`text-2xl font-bold ${statusFilter === 'quotation' ? 'text-amber-400' : ''}`}>{quotationCount}</p>
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-10 bg-background" placeholder="Search customer, equipment or invoice #…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending','active','completed','overdue','cancelled'].map(s =>
              <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All Statuses' : s}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i) =>
          <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />
        )}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No bookings found</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting the search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">Invoice #</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipment</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rental Period</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Total</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b, idx) => (
                <TableRow key={b.id as string}
                  className={`border-border/40 hover:bg-muted/20 cursor-pointer transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}
                  onClick={() => setViewingId(b.id as string)}>
                  <TableCell className="py-3">
                    <span className="font-mono text-xs font-bold" style={{ color: 'oklch(0.72 0.22 270)' }}>
                      {(b.invoice_number as string) || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.76 0.26 350))' }}>
                        {(b.customer_name as string)?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{b.customer_name as string}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground max-w-40 truncate block" title={b.equipment_names as string}>
                      {(b.equipment_names as string) || '—'}
                      {Number(b.item_count) > 1 && (
                        <span className="ml-1.5 text-xs" style={{ color: 'oklch(0.72 0.22 270)' }}>+{Number(b.item_count)-1}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(b.start_date as string), 'MMM d')} – {format(new Date(b.end_date as string), 'MMM d, yy')}
                  </TableCell>
                  <TableCell className="py-3 text-right font-bold text-sm">
                    ${(b.estimated_cost as number)?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? '—'}
                  </TableCell>
                  <TableCell className="py-3">
                    {b.is_quotation ? (
                      <Badge className="text-xs border px-2 py-0.5"
                        style={{ background: 'oklch(0.80 0.22 90 / 0.12)', color: 'oklch(0.75 0.22 90)', borderColor: 'oklch(0.80 0.22 90 / 0.35)' }}>
                        📋 Quotation
                      </Badge>
                    ) : (
                      <Badge className={`text-xs capitalize border px-2 py-0.5 ${statusCls(b.status as string)}`} variant="outline">
                        <span className="h-1.5 w-1.5 rounded-full mr-1.5 inline-block"
                          style={{ background: STATUS_META[b.status as string]?.dot || '#888' }} />
                        {b.status as string}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-violet-400"
                      onClick={() => setViewingId(b.id as string)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CREATE / QUOTATION DIALOG  — full-width professional CRM form
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">

          {/* ── Dialog top bar ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60"
            style={{ background: 'linear-gradient(135deg, oklch(0.12 0.03 265 / 0.8), oklch(0.10 0.02 265 / 0.6))' }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: header.is_quotation
                  ? 'linear-gradient(135deg, oklch(0.70 0.22 90), oklch(0.65 0.22 60))'
                  : 'linear-gradient(135deg, oklch(0.60 0.28 270), oklch(0.55 0.28 300))' }}>
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm">{header.is_quotation ? 'New Quotation' : 'New Booking / Invoice'}</h2>
                <p className="text-xs text-muted-foreground">Fill in the details below</p>
              </div>
            </div>
            {/* Quotation toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-muted-foreground">{header.is_quotation ? 'Quotation' : 'Booking'}</span>
              <div className={`relative inline-flex h-5 w-10 rounded-full transition-colors duration-200 ${header.is_quotation ? 'bg-amber-500' : 'bg-violet-600'}`}
                onClick={() => setHeader(p => ({ ...p, is_quotation: !p.is_quotation }))}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${header.is_quotation ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ── Section 1: Client & Period ── */}
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Client & Rental Period
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5 lg:col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">Customer *</Label>
                  <Select value={header.customer_id} onValueChange={v => setHeader(p => ({...p, customer_id: v}))}>
                    <SelectTrigger className="h-10 bg-background border-border/80">
                      <SelectValue placeholder="Select customer…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {(customers as Record<string,unknown>[]).filter(c => c.status === 'active').map(c => (
                        <SelectItem key={c.id as string} value={c.id as string}>
                          <div>
                            <div className="font-medium">{c.name as string}</div>
                            {c.email && <div className="text-xs text-muted-foreground">{c.email as string}</div>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Start Date *</Label>
                  <Input className="h-10 bg-background border-border/80" type="date" lang="en-US"
                    value={header.start_date} onChange={setH('start_date')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">End Date *</Label>
                  <Input className="h-10 bg-background border-border/80" type="date" lang="en-US"
                    value={header.end_date} onChange={setH('end_date')} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Initial Status</Label>
                  <Select value={header.status} onValueChange={v => setHeader(p => ({...p, status: v}))}>
                    <SelectTrigger className="h-10 bg-background border-border/80"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active (start now)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {header.is_quotation && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Quotation Expires</Label>
                    <Input className="h-10 bg-background border-border/80" type="date" lang="en-US"
                      value={header.quotation_expires_at}
                      onChange={e => setHeader(p => ({ ...p, quotation_expires_at: e.target.value }))} />
                  </div>
                )}

                <div className={`space-y-1.5 ${header.is_quotation ? '' : 'lg:col-span-2'}`}>
                  <Label className="text-xs font-medium text-muted-foreground">Notes / Terms</Label>
                  <Textarea className="bg-background border-border/80 resize-none text-sm" rows={2}
                    placeholder="Any special terms, notes, or instructions…"
                    value={header.notes}
                    onChange={setH('notes')} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Line Items ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Line Items
                  <span className="normal-case font-normal text-muted-foreground/60">({lines.length} item{lines.length !== 1 ? 's' : ''})</span>
                </p>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={() => setLines(p => [...p, newLine()])}>
                  <Plus className="h-3.5 w-3.5" />Add Line
                </Button>
              </div>

              {lines.map((line, i) => (
                <LineItemRow key={line._key} item={line} index={i}
                  allEquipment={allEquipment}
                  startDate={header.start_date} endDate={header.end_date}
                  onChange={updateLine} onRemove={removeLine} canRemove={lines.length > 1} />
              ))}
            </div>

            {/* ── Section 3: Pricing Summary ── */}
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Pricing & Totals
                </p>
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Adjustments */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Security Deposit ($)</Label>
                    <Input className="h-10 bg-background border-border/80 font-mono" type="number" min="0" step="0.01"
                      value={header.security_deposit} onChange={setH('security_deposit')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Discount ($)</Label>
                    <Input className="h-10 bg-background border-border/80 font-mono" type="number" min="0" step="0.01"
                      value={header.discount} onChange={setH('discount')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Tax Rate (%)</Label>
                    <Input className="h-10 bg-background border-border/80 font-mono" type="number" min="0" step="0.1" max="100"
                      value={header.tax_rate} onChange={setH('tax_rate')} />
                  </div>
                </div>

                {/* Running total */}
                <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount</span>
                      <span className="font-mono">−${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxRate}%)</span>
                      <span className="font-mono">+${taxAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {deposit > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Security Deposit</span>
                      <span className="font-mono">${deposit.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border/60 pt-2 mt-1"
                    style={{ color: 'oklch(0.78 0.22 195)' }}>
                    <span>Grand Total</span>
                    <span className="font-mono">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {!header.customer_id && <span className="text-rose-400">↑ Select a customer</span>}
              {header.customer_id && (!header.start_date || !header.end_date) && <span className="text-amber-400">↑ Set rental dates</span>}
              {header.customer_id && header.start_date && header.end_date && !lines.some(l => l.equipment_id) && <span className="text-amber-400">↑ Add at least one equipment line</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!canCreate || createMutation.isPending}
                className="min-w-36"
                style={{ background: header.is_quotation
                  ? 'linear-gradient(135deg, oklch(0.65 0.22 90), oklch(0.60 0.22 60))'
                  : 'linear-gradient(135deg, oklch(0.60 0.28 270), oklch(0.55 0.28 300))' }}>
                {createMutation.isPending
                  ? 'Saving…'
                  : header.is_quotation
                    ? `💾 Save Quotation · $${grandTotal.toFixed(2)}`
                    : `✓ Create Invoice · $${grandTotal.toFixed(2)}`
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════
          INVOICE DETAIL / VIEW DIALOG
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!viewingId} onOpenChange={() => setViewingId(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {invoiceLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'oklch(0.70 0.28 270) transparent' }} />
            </div>
          ) : invoiceDetail ? (() => {
            const inv = invoiceDetail;
            const items = (inv.items || []) as Record<string, unknown>[];
            const inv_subtotal   = items.reduce((s, it) => s + Number(it.line_total || 0), 0);
            const inv_discount   = Number(inv.discount  || 0);
            const inv_taxRate    = Number(inv.tax_rate   || 0);
            const inv_taxAmt     = (inv_subtotal - inv_discount) * inv_taxRate / 100;
            const inv_deposit    = Number(inv.security_deposit || 0);
            const inv_grandTotal = Math.max(0, inv_subtotal - inv_discount + inv_taxAmt);
            const statusKey      = inv.status as string;

            return (
              <div>
                {/* Invoice header */}
                <div className="relative overflow-hidden px-8 pt-7 pb-6 rounded-t-lg"
                  style={{ background: 'linear-gradient(135deg, oklch(0.13 0.04 265) 0%, oklch(0.10 0.025 265) 100%)' }}>
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.07]"
                    style={{ background: 'oklch(0.70 0.28 270)' }}/>
                  <div className="absolute right-16 bottom-0 h-24 w-24 rounded-full opacity-[0.05]"
                    style={{ background: 'oklch(0.78 0.22 195)' }}/>

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                            {inv.is_quotation ? 'Quotation' : 'Invoice'}
                          </p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold font-mono tracking-tight text-white">
                        {(inv.invoice_number as string) || '—'}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Issued {format(new Date(inv.created_at as string), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 mt-1">
                      {inv.is_quotation ? (
                        <Badge className="text-sm px-3 py-1"
                          style={{ background: 'oklch(0.80 0.22 90 / 0.2)', color: 'oklch(0.88 0.20 90)', borderColor: 'oklch(0.80 0.22 90 / 0.5)', border: '1px solid' }}>
                          📋 Quotation
                        </Badge>
                      ) : (
                        <Badge className={`text-sm font-semibold capitalize border px-3 py-1 ${statusCls(statusKey)}`} variant="outline">
                          <span className="h-2 w-2 rounded-full mr-1.5 inline-block"
                            style={{ background: STATUS_META[statusKey]?.dot || '#888' }} />
                          {statusKey}
                        </Badge>
                      )}
                      <p className="text-2xl font-bold font-mono text-white mt-2">
                        ${inv_grandTotal.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/40">Grand Total</p>
                    </div>
                  </div>
                </div>

                {/* Customer + Rental Period panels */}
                <div className="grid grid-cols-2 divide-x divide-border/40 border-b border-border/40">
                  <div className="px-6 py-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1 mb-2">
                      <User className="h-3 w-3" /> Bill To
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.76 0.26 350))' }}>
                        {(inv.customer_name as string)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{inv.customer_name as string}</p>
                        {inv.customer_email && <p className="text-xs text-muted-foreground">{inv.customer_email as string}</p>}
                        {inv.customer_phone && <p className="text-xs text-muted-foreground">{inv.customer_phone as string}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1 mb-2">
                      <Calendar className="h-3 w-3" /> Rental Period
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground">From</p>
                        <p className="font-semibold">{format(new Date(inv.start_date as string), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="text-muted-foreground/40 font-light text-xl">→</div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">To</p>
                        <p className="font-semibold">{format(new Date(inv.end_date as string), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {inv.assigned_user_name && (
                      <p className="text-xs text-muted-foreground mt-1">Assigned: {inv.assigned_user_name as string}</p>
                    )}
                  </div>
                </div>

                {/* Line items */}
                <div className="px-6 py-5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Line Items</p>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No line items recorded.</p>
                  ) : (
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="grid grid-cols-12 bg-muted/40 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/40">
                        <div className="col-span-4">Equipment</div>
                        <div className="col-span-3">SKU Units</div>
                        <div className="col-span-2 text-center">Rate</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      {items.map((it, idx) => {
                        const unitSkus = (it.unit_skus as Record<string,string>[]) || [];
                        return (
                          <div key={it.id as string}
                            className={`grid grid-cols-12 px-4 py-3.5 text-sm items-start ${idx < items.length-1 ? 'border-b border-border/30' : ''}`}>
                            <div className="col-span-4 pr-2">
                              <p className="font-semibold">{it.equipment_name as string}</p>
                              {it.description && <p className="text-xs text-muted-foreground mt-0.5">{it.description as string}</p>}
                            </div>
                            <div className="col-span-3 flex flex-wrap gap-1">
                              {unitSkus.length > 0 ? unitSkus.map(u => (
                                <span key={u.id} className="font-mono text-[10px] px-2 py-0.5 rounded-md"
                                  style={{ background: 'oklch(0.70 0.28 270 / 0.15)', color: 'oklch(0.78 0.22 270)', border: '1px solid oklch(0.70 0.28 270 / 0.25)' }}>
                                  {u.sku_code}
                                </span>
                              )) : (
                                <span className="text-xs text-muted-foreground">No unit</span>
                              )}
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-xs font-mono">${Number(it.unit_rate).toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground ml-0.5">{PRICING_SHORT[it.pricing_type as string] || ''}</span>
                            </div>
                            <div className="col-span-1 text-center text-xs text-muted-foreground font-mono">{Number(it.quantity)}</div>
                            <div className="col-span-2 text-right font-bold font-mono text-sm"
                              style={{ color: 'oklch(0.78 0.22 195)' }}>
                              ${Number(it.line_total).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span className="font-mono">${inv_subtotal.toFixed(2)}</span>
                    </div>
                    {inv_discount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount</span><span className="font-mono">−${inv_discount.toFixed(2)}</span>
                      </div>
                    )}
                    {inv_taxRate > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax ({inv_taxRate}%)</span><span className="font-mono">+${inv_taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {inv_deposit > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Security Deposit</span><span className="font-mono">${inv_deposit.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2"
                      style={{ color: 'oklch(0.78 0.22 195)' }}>
                      <span>Total Due</span><span className="font-mono">${inv_grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Notes: </span>{inv.notes as string}
                    </div>
                  )}
                </div>

                {/* Status footer */}
                <div className="px-6 py-4 border-t border-border/40 bg-muted/10 rounded-b-lg">
                  {inv.is_quotation ? (
                    <div className="flex items-center gap-3">
                      <Button className="gap-2"
                        style={{ background: 'linear-gradient(135deg, oklch(0.60 0.28 270), oklch(0.55 0.28 300))' }}
                        onClick={() => handleConvertQuotation(inv.id as string)}>
                        <ArrowRightCircle className="h-4 w-4" /> Convert to Booking
                      </Button>
                      <Button variant="outline" size="sm"
                        className="text-zinc-400 border-zinc-500/40 hover:bg-zinc-500/10"
                        onClick={() => { updateStatusMutation.mutate({ id: inv.id as string, status: 'cancelled' }); setViewingId(null); }}>
                        Cancel Quotation
                      </Button>
                      {inv.quotation_expires_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Expires: {format(new Date(inv.quotation_expires_at as string), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5">Update Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['pending','active','completed','cancelled'] as const).map(s => {
                          const isCurrent = inv.status === s;
                          const m = STATUS_META[s];
                          return (
                            <Button key={s} size="sm" variant="outline"
                              className={`capitalize text-xs gap-1.5 transition-all border ${isCurrent ? `${m.bg} ${m.text} ${m.border} font-semibold` : 'text-muted-foreground hover:' + m.text}`}
                              onClick={() => { updateStatusMutation.mutate({ id: inv.id as string, status: s }); setViewingId(null); }}>
                              {isCurrent && <CheckCircle2 className="h-3 w-3" />}
                              {s}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
