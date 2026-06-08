'use client';
import { useState } from 'react';
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
import { Plus, Search, CalendarDays, Eye, Trash2, FileText, Package, CheckCircle2, Clock, Wrench, AlertTriangle, Building2, User, Hash, Calendar, DollarSign, Tag } from 'lucide-react';
import { format } from 'date-fns';

/* ── Types ─────────────────────────────────────────────────────────── */
interface LineItem {
  _key: string; // local only
  equipment_id: string;
  equipment_unit_id: string;
  description: string;
  pricing_type: string; // fixed | daily | weekly | monthly | hourly
  unit_rate: string;
  quantity: string;
}

const PRICING_LABELS: Record<string, string> = {
  fixed: 'Fixed (one-time)', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', hourly: 'Hourly',
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border-green-500/30',
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/10  text-blue-400  border-blue-500/30',
  overdue:   'bg-red-500/10   text-red-400   border-red-500/30',
  cancelled: 'bg-gray-500/10  text-gray-400  border-gray-500/30',
};

/* ── Line item row component ─────────────────────────────────────── */
function LineItemRow({
  item, index, allEquipment, startDate, endDate, onChange, onRemove, canRemove,
}: {
  item: LineItem; index: number;
  allEquipment: Record<string, unknown>[];
  startDate: string; endDate: string;
  onChange: (key: string, field: keyof LineItem, val: string) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}) {
  const { units: allUnits } = useEquipmentUnits(item.equipment_id || null);
  const { data: availUnits = [] } = useAvailableUnits(item.equipment_id || null, startDate, endDate);
  const availIds = new Set(availUnits.map(u => u.id));

  const lineTotal = (parseFloat(item.unit_rate) || 0) * (parseFloat(item.quantity) || 1);
  const selectedEq = allEquipment.find(e => e.id === item.equipment_id);

  // Auto-fill rate when equipment changes
  const handleEquipmentChange = (id: string) => {
    const eq = allEquipment.find(e => e.id === id);
    onChange(item._key, 'equipment_id', id);
    onChange(item._key, 'equipment_unit_id', '');
    if (eq) {
      const pt = (eq.pricing_type as string) === 'hourly' ? 'hourly' : 'daily';
      onChange(item._key, 'pricing_type', pt);
      onChange(item._key, 'unit_rate',
        pt === 'hourly'
          ? String(eq.hourly_rate ?? '')
          : String(eq.fixed_rate ?? '')
      );
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Line {index + 1}</span>
        {canRemove && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemove(item._key)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Equipment select */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Equipment *</Label>
          <Select value={item.equipment_id} onValueChange={handleEquipmentChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {allEquipment.map(e => (
                <SelectItem key={e.id as string} value={e.id as string}>
                  {e.name as string}
                  {Number(e.available_units) > 0 && <span className="ml-2 text-xs text-green-500">({Number(e.available_units)} avail)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Description / Notes</Label>
          <Input className="h-9 text-sm" placeholder="Optional description" value={item.description}
            onChange={e => onChange(item._key, 'description', e.target.value)} />
        </div>
      </div>

      {/* SKU unit chips — shown when equipment is selected and has tracked units */}
      {item.equipment_id && (allUnits as unknown[]).length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Package className="h-3 w-3 text-violet-400" />
            Select Unit (SKU)
            {startDate && endDate && <span className="text-green-400 ml-1">· {availIds.size} free on dates</span>}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {(allUnits as Record<string, unknown>[]).map((u) => {
              const uid = u.id as string;
              const sku = u.sku_code as string;
              const st  = u.status as string;
              const datesSet = !!(startDate && endDate);
              const isBooked   = datesSet ? !availIds.has(uid) : st === 'rented-out';
              const isDisabled = !datesSet
                ? (st === 'maintenance' || st === 'damaged' || st === 'retired')
                : !availIds.has(uid);
              const isSelected = item.equipment_unit_id === uid;

              const chip = isSelected
                ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                : isBooked
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-400/60 cursor-not-allowed'
                  : isDisabled
                    ? 'border-red-500/20 bg-red-500/10 text-red-400/50 cursor-not-allowed'
                    : 'border-green-500/40 bg-green-500/10 text-green-300 hover:border-violet-500 hover:bg-violet-500/15 cursor-pointer';

              const Icon = isBooked ? Clock : (st === 'maintenance' ? Wrench : st === 'damaged' || st === 'retired' ? AlertTriangle : CheckCircle2);
              return (
                <button key={uid} type="button" disabled={isDisabled || isBooked}
                  onClick={() => onChange(item._key, 'equipment_unit_id', isSelected ? '' : uid)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all ${chip}`}
                  title={isBooked ? 'Booked on these dates' : st}>
                  <Icon className="h-2.5 w-2.5 shrink-0" />
                  {sku}
                </button>
              );
            })}
          </div>
          {item.equipment_unit_id && (
            <p className="text-[11px] text-violet-400">
              ✓ Unit <span className="font-mono font-bold">
                {(allUnits as Record<string, unknown>[]).find(u => u.id === item.equipment_unit_id)?.sku_code as string}
              </span> selected
            </p>
          )}
        </div>
      )}

      {/* Pricing row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Pricing Type</Label>
          <Select value={item.pricing_type} onValueChange={v => onChange(item._key, 'pricing_type', v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRICING_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Rate ($)
            {item.pricing_type !== 'fixed' && <span className="text-muted-foreground ml-1">/ {item.pricing_type}</span>}
          </Label>
          <Input className="h-9 text-sm" type="number" min="0" step="0.01" placeholder="0.00"
            value={item.unit_rate} onChange={e => onChange(item._key, 'unit_rate', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {item.pricing_type === 'fixed' ? 'Qty' : item.pricing_type === 'hourly' ? 'Hours' : 'Days / Units'}
          </Label>
          <Input className="h-9 text-sm" type="number" min="1" step="1" placeholder="1"
            value={item.quantity} onChange={e => onChange(item._key, 'quantity', e.target.value)} />
        </div>
      </div>

      {/* Line total */}
      <div className="flex justify-end">
        <span className="text-sm font-semibold text-cyan-400">
          Line total: ${lineTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
const EMPTY_HEADER = {
  customer_id: '', assigned_user_id: '',
  start_date: '', end_date: '',
  security_deposit: '0', discount: '0', tax_rate: '0', notes: '', status: 'pending',
};

function newLine(): LineItem {
  return { _key: Math.random().toString(36).slice(2), equipment_id: '', equipment_unit_id: '', description: '', pricing_type: 'daily', unit_rate: '', quantity: '1' };
}

export default function BookingsPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [open, setOpen]           = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const [header, setHeader]   = useState(EMPTY_HEADER);
  const [lines, setLines]     = useState<LineItem[]>([newLine()]);

  const { bookings, isLoading, createMutation, updateStatusMutation } = useBookings({ search, status: statusFilter });
  const { data: invoiceDetail, isLoading: invoiceLoading } = useBookingById(viewingId);
  const { equipment } = useEquipment();
  const { customers } = useCustomers();

  const allEquipment = (equipment as Record<string, unknown>[]).filter(e => e.status !== 'retired');

  /* totals */
  const subtotal    = lines.reduce((s, l) => s + (parseFloat(l.unit_rate) || 0) * (parseFloat(l.quantity) || 1), 0);
  const discount    = parseFloat(header.discount) || 0;
  const taxRate     = parseFloat(header.tax_rate) || 0;
  const taxAmt      = ((subtotal - discount) * taxRate) / 100;
  const grandTotal  = Math.max(0, subtotal - discount + taxAmt);

  const setH = (k: keyof typeof EMPTY_HEADER) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setHeader(p => ({ ...p, [k]: e.target.value }));

  const updateLine = (key: string, field: keyof LineItem, val: string) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: val } : l));

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key));

  const handleCreate = () => {
    const items = lines.filter(l => l.equipment_id).map(l => ({
      equipment_id: l.equipment_id,
      equipment_unit_id: l.equipment_unit_id || undefined,
      description: l.description,
      pricing_type: l.pricing_type,
      unit_rate: parseFloat(l.unit_rate) || 0,
      quantity: parseFloat(l.quantity) || 1,
    }));
    createMutation.mutate(
      { ...header, items, estimated_cost: grandTotal, discount, tax_rate: taxRate } as never,
      { onSuccess: () => { setOpen(false); setHeader(EMPTY_HEADER); setLines([newLine()]); } }
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Bookings</h1>
          <p className="text-muted-foreground">{(bookings as unknown[]).length} invoices</p>
        </div>
        <Button onClick={() => { setHeader(EMPTY_HEADER); setLines([newLine()]); setOpen(true); }}
          className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />New Booking
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending','active','overdue','completed'] as const).map(s => (
          <Card key={s} className="cursor-pointer hover:border-violet-500/40 transition-colors"
            onClick={() => setStatus(s === statusFilter as never ? 'all' : s)}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
              <p className="text-2xl font-bold">{(bookings as Record<string,unknown>[]).filter(b => b.status === s).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by customer, equipment or invoice #…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending','active','completed','overdue','cancelled'].map(s =>
              <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="h-12 bg-muted rounded"/>)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
          <p className="text-muted-foreground">No bookings found</p>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => (
                <TableRow key={b.id as string}>
                  <TableCell className="font-mono text-xs text-violet-400">
                    {(b.invoice_number as string) || '—'}
                  </TableCell>
                  <TableCell className="font-medium">{b.customer_name as string}</TableCell>
                  <TableCell className="text-sm max-w-48 truncate" title={b.equipment_names as string}>
                    {b.equipment_names as string || (b as Record<string,unknown>).equipment_name as string}
                    {Number(b.item_count) > 1 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">+{Number(b.item_count)-1} more</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(b.start_date as string),'MMM d')} – {format(new Date(b.end_date as string),'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${(b.estimated_cost as number)?.toLocaleString(undefined,{minimumFractionDigits:2}) ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize border ${STATUS_COLORS[b.status as string]||''}`} variant="outline">{b.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-400 hover:text-violet-300"
                      onClick={() => setViewingId(b.id as string)}>
                      <Eye className="h-3 w-3"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── CREATE / Invoice Builder Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" />
              New Booking / Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ── Invoice header ── */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/50 bg-muted/10">
              <h3 className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Details</h3>

              <div className="space-y-1">
                <Label className="text-xs">Customer *</Label>
                <Select value={header.customer_id} onValueChange={v => setHeader(p => ({...p, customer_id:v}))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select customer"/></SelectTrigger>
                  <SelectContent>
                    {(customers as Record<string,unknown>[]).filter(c => c.status==='active').map(c => (
                      <SelectItem key={c.id as string} value={c.id as string}>{c.name as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={header.status} onValueChange={v => setHeader(p => ({...p, status:v}))}>
                  <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Start Date *</Label>
                <Input className="h-9" type="date" value={header.start_date} onChange={setH('start_date')}/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date *</Label>
                <Input className="h-9" type="date" value={header.end_date} onChange={setH('end_date')}/>
              </div>

              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Notes</Label>
                <Input className="h-9" placeholder="Any notes for this invoice…" value={header.notes} onChange={setH('notes')}/>
              </div>
            </div>

            {/* ── Line items ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                <Button variant="outline" size="sm" onClick={() => setLines(p => [...p, newLine()])}>
                  <Plus className="h-3.5 w-3.5 mr-1"/>Add Line
                </Button>
              </div>

              {lines.map((line, i) => (
                <LineItemRow
                  key={line._key} item={line} index={i}
                  allEquipment={allEquipment}
                  startDate={header.start_date} endDate={header.end_date}
                  onChange={updateLine}
                  onRemove={removeLine}
                  canRemove={lines.length > 1}
                />
              ))}
            </div>

            {/* ── Totals ── */}
            <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Security Deposit ($)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" value={header.security_deposit} onChange={setH('security_deposit')}/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Discount ($)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" value={header.discount} onChange={setH('discount')}/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input className="h-9" type="number" min="0" step="0.1" max="100" value={header.tax_rate} onChange={setH('tax_rate')}/>
                </div>
              </div>

              {/* Running total breakdown */}
              <div className="border-t border-border/40 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount</span><span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({taxRate}%)</span><span>+${taxAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-cyan-400 border-t border-border/40 pt-2">
                  <span>Total</span><span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!canCreate || createMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700">
              {createMutation.isPending ? 'Creating…' : `Create Invoice · $${grandTotal.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invoice Detail Dialog ── */}
      <Dialog open={!!viewingId} onOpenChange={() => setViewingId(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          {invoiceLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"/>
            </div>
          ) : invoiceDetail ? (() => {
            const inv = invoiceDetail;
            const items = (inv.items || []) as Record<string, unknown>[];
            const subtotal   = items.reduce((s, it) => s + Number(it.line_total || 0), 0);
            const discount   = Number(inv.discount  || 0);
            const taxRate    = Number(inv.tax_rate   || 0);
            const taxAmt     = (subtotal - discount) * taxRate / 100;
            const grandTotal = Math.max(0, subtotal - discount + taxAmt);
            const statusKey  = inv.status as string;
            const PRICING_SHORT: Record<string, string> = { fixed:'Fixed', daily:'/ day', weekly:'/ wk', monthly:'/ mo', hourly:'/ hr' };

            return (
              <div>
                {/* ── Invoice header band ── */}
                <div className="relative overflow-hidden rounded-t-lg px-6 pt-6 pb-5"
                  style={{ background: 'linear-gradient(135deg, oklch(0.14 0.035 265) 0%, oklch(0.10 0.025 265) 100%)' }}>
                  {/* decorative orbs */}
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
                    style={{ background: 'oklch(0.70 0.28 270)' }}/>
                  <div className="absolute right-8 bottom-0 h-20 w-20 rounded-full opacity-8"
                    style={{ background: 'oklch(0.78 0.22 195)' }}/>

                  <div className="relative flex items-start justify-between gap-4">
                    {/* Left: brand + invoice number */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
                          <FileText className="h-4 w-4 text-white"/>
                        </div>
                        <span className="text-xs font-semibold tracking-widest uppercase text-white/50">Invoice</span>
                      </div>
                      <p className="text-2xl font-bold font-mono tracking-tight text-white">
                        {(inv.invoice_number as string) || '—'}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Created {format(new Date(inv.created_at as string), 'MMM d, yyyy')}
                      </p>
                    </div>

                    {/* Right: status badge */}
                    <div className="mt-1">
                      <Badge className={`text-sm font-semibold capitalize border px-3 py-1 ${STATUS_COLORS[statusKey]||''}`} variant="outline">
                        {statusKey}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* ── Customer + dates row ── */}
                <div className="grid grid-cols-2 gap-px bg-border/30 border-b border-border/30">
                  <div className="bg-background px-6 py-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3"/> Bill To
                    </p>
                    <p className="font-semibold text-sm">{inv.customer_name as string}</p>
                    {inv.customer_email && <p className="text-xs text-muted-foreground">{inv.customer_email as string}</p>}
                    {inv.customer_phone && <p className="text-xs text-muted-foreground">{inv.customer_phone as string}</p>}
                  </div>
                  <div className="bg-background px-6 py-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3"/> Rental Period
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{format(new Date(inv.start_date as string), 'MMM d, yyyy')}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{format(new Date(inv.end_date as string), 'MMM d, yyyy')}</span>
                    </div>
                    {inv.assigned_user_name && (
                      <p className="text-xs text-muted-foreground">Assigned: {inv.assigned_user_name as string}</p>
                    )}
                  </div>
                </div>

                {/* ── Line items table ── */}
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1">
                    <Tag className="h-3 w-3"/> Line Items
                  </p>

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No line items recorded.</p>
                  ) : (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      {/* Table head */}
                      <div className="grid grid-cols-12 bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <div className="col-span-5">Equipment</div>
                        <div className="col-span-2">SKU</div>
                        <div className="col-span-2 text-center">Rate</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>

                      {/* Rows */}
                      {items.map((it, idx) => (
                        <div key={it.id as string}
                          className={`grid grid-cols-12 px-3 py-3 text-sm items-center ${idx < items.length - 1 ? 'border-b border-border/30' : ''}`}>
                          <div className="col-span-5">
                            <p className="font-medium truncate">{it.equipment_name as string}</p>
                            {it.description && <p className="text-xs text-muted-foreground truncate">{it.description as string}</p>}
                          </div>
                          <div className="col-span-2">
                            {it.unit_sku_code
                              ? <span className="font-mono text-xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{it.unit_sku_code as string}</span>
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-xs">${Number(it.unit_rate).toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground ml-0.5">
                              {PRICING_SHORT[it.pricing_type as string] || ''}
                            </span>
                          </div>
                          <div className="col-span-1 text-center text-xs text-muted-foreground">
                            {Number(it.quantity)}
                          </div>
                          <div className="col-span-2 text-right font-semibold text-cyan-400">
                            ${Number(it.line_total).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Totals ── */}
                  <div className="mt-4 space-y-1.5 text-sm ml-auto max-w-56">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount</span><span>−${discount.toFixed(2)}</span>
                      </div>
                    )}
                    {taxRate > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax ({taxRate}%)</span><span>+${taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {Number(inv.security_deposit) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Security Deposit</span><span>${Number(inv.security_deposit).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base text-cyan-400 border-t border-border/40 pt-2 mt-2">
                      <span>Total Due</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Notes: </span>{inv.notes as string}
                    </div>
                  )}
                </div>

                {/* ── Status actions footer ── */}
                <div className="px-6 py-4 border-t border-border/40 bg-muted/10 rounded-b-lg">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['pending','active','completed','cancelled'] as const).map(s => {
                      const isCurrent = inv.status === s;
                      const colors: Record<string, string> = {
                        pending:   'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10',
                        active:    'border-green-500/50  text-green-400  hover:bg-green-500/10',
                        completed: 'border-blue-500/50   text-blue-400   hover:bg-blue-500/10',
                        cancelled: 'border-gray-500/50   text-gray-400   hover:bg-gray-500/10',
                      };
                      return (
                        <Button key={s} size="sm" variant="outline"
                          className={`capitalize text-xs transition-all ${isCurrent ? 'bg-violet-600 border-violet-500 text-white hover:bg-violet-700' : colors[s]}`}
                          onClick={() => {
                            updateStatusMutation.mutate({ id: inv.id as string, status: s });
                            setViewingId(null);
                          }}>
                          {isCurrent && <CheckCircle2 className="h-3 w-3 mr-1"/>}
                          {s}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
