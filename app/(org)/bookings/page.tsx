'use client';
import { useState, useEffect } from 'react';
import { useBookings } from '@/hooks/use-bookings';
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
import { Plus, Search, CalendarDays, Eye, Trash2, FileText, Package, CheckCircle2, Clock, Wrench, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [viewing, setViewing]     = useState<Record<string, unknown> | null>(null);
  const [showItems, setShowItems] = useState<string | null>(null);

  const [header, setHeader]   = useState(EMPTY_HEADER);
  const [lines, setLines]     = useState<LineItem[]>([newLine()]);

  const { bookings, isLoading, createMutation, updateStatusMutation } = useBookings({ search, status: statusFilter });
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewing(b)}>
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

      {/* ── View / Status Dialog ── */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-400"/>
              {(viewing?.invoice_number as string) || 'Booking Details'}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">Customer</p><p className="font-medium">{viewing.customer_name as string}</p></div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge className={`text-xs capitalize border ${STATUS_COLORS[viewing.status as string]||''}`} variant="outline">{viewing.status as string}</Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Start</p><p>{format(new Date(viewing.start_date as string),'MMM d, yyyy')}</p></div>
                <div><p className="text-muted-foreground text-xs">End</p><p>{format(new Date(viewing.end_date as string),'MMM d, yyyy')}</p></div>
                <div><p className="text-muted-foreground text-xs">Total</p><p className="font-semibold text-cyan-400">${(viewing.estimated_cost as number)?.toLocaleString(undefined,{minimumFractionDigits:2})}</p></div>
                {Number(viewing.discount) > 0 && <div><p className="text-muted-foreground text-xs">Discount</p><p className="text-rose-400">−${Number(viewing.discount).toFixed(2)}</p></div>}
              </div>

              {/* Equipment lines */}
              {(viewing.equipment_names as string) && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Equipment</p>
                  <p className="text-sm">{viewing.equipment_names as string}</p>
                </div>
              )}

              {viewing.notes && <div><p className="text-muted-foreground text-xs">Notes</p><p>{viewing.notes as string}</p></div>}

              <div>
                <Label className="mb-2 block text-xs">Update Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {['pending','active','completed','cancelled'].map(s => (
                    <Button key={s} size="sm"
                      variant={viewing.status===s ? 'default' : 'outline'}
                      className={`capitalize text-xs ${viewing.status===s ? 'bg-violet-600' : ''}`}
                      onClick={() => { updateStatusMutation.mutate({id: viewing.id as string, status: s}); setViewing(null); }}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
