'use client';
import { useState } from 'react';
import { useBookings, BookingForm } from '@/hooks/use-bookings';
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
import { Plus, Search, CalendarDays, Eye, Cpu, CheckCircle2, Clock, Wrench, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-blue-500/10 text-blue-700 border-blue-200',
  overdue: 'bg-red-500/10 text-red-700 border-red-200',
  cancelled: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<BookingForm>({
    customer_id: '', equipment_id: '', equipment_unit_id: '', assigned_user_id: '',
    start_date: '', end_date: '', pricing_type: 'fixed',
    fixed_rate: '', hourly_rate: '', hours_used: '',
    estimated_cost: '', security_deposit: '', notes: '', status: 'pending',
  });

  const { bookings, isLoading, createMutation, updateStatusMutation, EMPTY_FORM } = useBookings({ search, status: statusFilter });
  const { equipment } = useEquipment();
  const { customers } = useCustomers();

  // All units for the selected equipment (shown immediately after equipment is picked)
  const { units: allUnits } = useEquipmentUnits(form.equipment_id || null);

  // Available (conflict-free) unit IDs when dates are also set
  const { data: availableUnits = [] } = useAvailableUnits(
    form.equipment_id || null,
    form.start_date,
    form.end_date,
  );
  const availableIds = new Set(availableUnits.map((u) => u.id));

  const onEquipmentChange = (id: string) => {
    const eq = (equipment as Record<string, unknown>[]).find(e => e.id === id);
    if (eq) {
      setForm(p => ({
        ...p,
        equipment_id: id,
        equipment_unit_id: '', // reset SKU when equipment changes
        pricing_type: (eq.pricing_type as string) || 'fixed',
        fixed_rate: eq.fixed_rate != null ? String(eq.fixed_rate) : '',
        hourly_rate: eq.hourly_rate != null ? String(eq.hourly_rate) : '',
      }));
    } else {
      setForm(p => ({ ...p, equipment_id: id, equipment_unit_id: '' }));
    }
  };

  const handleCreate = () => {
    createMutation.mutate(form, { onSuccess: () => { setOpen(false); setForm(EMPTY_FORM); } });
  };

  const set = (k: keyof BookingForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const filtered = (bookings as Record<string, unknown>[]).filter(b => {
    if (search) {
      const q = search.toLowerCase();
      if (!(b.equipment_name as string)?.toLowerCase().includes(q) && !(b.customer_name as string)?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">{(bookings as unknown[]).length} total bookings</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Booking</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'active', 'overdue', 'completed'] as const).map(s => (
          <Card key={s}><CardContent className="pt-4"><p className="text-xs text-muted-foreground capitalize">{s}</p><p className="text-2xl font-bold">{(bookings as Record<string, unknown>[]).filter(b => b.status === s).length}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No bookings found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => (
                <TableRow key={b.id as string}>
                  <TableCell className="font-medium">
                    {b.equipment_name as string}
                    {b.equipment_sku_code && <span className="ml-1.5 text-xs font-mono text-violet-400 bg-violet-500/10 px-1 rounded">{b.equipment_sku_code as string}</span>}
                  </TableCell>
                  <TableCell>{b.customer_name as string}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(b.start_date as string), 'MMM d')} – {format(new Date(b.end_date as string), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>${(b.estimated_cost as number)?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize border ${STATUS_COLORS[b.status as string] || ''}`} variant="outline">{b.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewing(b)}><Eye className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipment *</Label>
              <Select value={form.equipment_id} onValueChange={onEquipmentChange}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>
                  {(equipment as Record<string, unknown>[])
                    .filter(e => e.status !== 'retired' && e.status !== 'damaged')
                    .map(e => (
                      <SelectItem key={e.id as string} value={e.id as string}>
                        {e.name as string}
                        {Number(e.available_units) > 0 && (
                          <span className="ml-2 text-xs text-green-500">({Number(e.available_units)} avail)</span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm(p => ({ ...p, customer_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {(customers as Record<string, unknown>[]).filter(c => c.status === 'active').map(c => (
                    <SelectItem key={c.id as string} value={c.id as string}>{c.name as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={set('start_date')} /></div>
              <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={set('end_date')} /></div>
            </div>

            {/* SKU unit picker — appears as soon as equipment is chosen */}
            {form.equipment_id && (allUnits as unknown[]).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-violet-400" />
                    Select Unit (SKU)
                  </Label>
                  {form.start_date && form.end_date && (
                    <span className="text-xs text-green-400">{availableIds.size} available for dates</span>
                  )}
                </div>

                {/* Unit chips — one per physical unit */}
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border/60 bg-muted/20">
                  {(allUnits as Record<string, unknown>[]).map((u) => {
                    const uid = u.id as string;
                    const sku = u.sku_code as string;
                    const st  = u.status as string;
                    const datesSet = !!(form.start_date && form.end_date);
                    // If dates are set: only available units are selectable; otherwise go by current status
                    const isBooked   = datesSet ? !availableIds.has(uid) : st === 'rented-out';
                    const isDisabled = datesSet ? !availableIds.has(uid) : (st === 'maintenance' || st === 'damaged' || st === 'retired');
                    const isSelected = form.equipment_unit_id === uid;

                    const chipColor = isSelected
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : isBooked
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 opacity-60 cursor-not-allowed'
                        : isDisabled
                          ? 'border-red-500/30 bg-red-500/10 text-red-400 opacity-50 cursor-not-allowed'
                          : 'border-green-500/40 bg-green-500/10 text-green-300 hover:border-violet-500 hover:bg-violet-500/10 cursor-pointer';

                    const StatusIcon = isBooked ? Clock : isDisabled ? (st === 'maintenance' ? Wrench : AlertTriangle) : CheckCircle2;

                    return (
                      <button
                        key={uid}
                        type="button"
                        disabled={isDisabled || isBooked}
                        onClick={() => setForm(p => ({ ...p, equipment_unit_id: isSelected ? '' : uid }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${chipColor}`}
                        title={isBooked ? 'Already booked for these dates' : isDisabled ? `Status: ${st}` : `Select unit ${sku}`}
                      >
                        <StatusIcon className="h-3 w-3 shrink-0" />
                        {sku}
                        {u.notes && <span className="ml-1 font-sans font-normal opacity-70">{u.notes as string}</span>}
                      </button>
                    );
                  })}
                </div>

                {form.equipment_unit_id && (
                  <p className="text-xs text-violet-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Unit <span className="font-mono font-bold">
                      {(allUnits as Record<string, unknown>[]).find(u => u.id === form.equipment_unit_id)?.sku_code as string}
                    </span> selected
                  </p>
                )}
                {!form.start_date && (
                  <p className="text-xs text-muted-foreground">Set dates to see availability for specific dates.</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Pricing Type</Label>
              <Select value={form.pricing_type} onValueChange={(v) => setForm(p => ({ ...p, pricing_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed (Daily)</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.pricing_type === 'fixed' && (
              <div className="space-y-2"><Label>Daily Rate ($)</Label><Input type="number" value={form.fixed_rate} onChange={set('fixed_rate')} /></div>
            )}
            {form.pricing_type === 'hourly' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} /></div>
                <div className="space-y-2"><Label>Estimated Hours</Label><Input type="number" value={form.hours_used} onChange={set('hours_used')} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Estimated Cost ($)</Label><Input type="number" value={form.estimated_cost} onChange={set('estimated_cost')} /></div>
              <div className="space-y-2"><Label>Security Deposit ($)</Label><Input type="number" value={form.security_deposit} onChange={set('security_deposit')} /></div>
            </div>
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={set('notes')} placeholder="Optional notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.equipment_id || !form.customer_id || !form.start_date || !form.end_date || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Equipment</p>
                  <p className="font-medium">{viewing.equipment_name as string}</p>
                  {viewing.equipment_sku_code && <p className="text-xs font-mono text-violet-400">{viewing.equipment_sku_code as string}</p>}
                </div>
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{viewing.customer_name as string}</p></div>
                <div><p className="text-muted-foreground">Start Date</p><p className="font-medium">{format(new Date(viewing.start_date as string), 'MMM d, yyyy')}</p></div>
                <div><p className="text-muted-foreground">End Date</p><p className="font-medium">{format(new Date(viewing.end_date as string), 'MMM d, yyyy')}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge className={`text-xs capitalize border ${STATUS_COLORS[viewing.status as string] || ''}`} variant="outline">{viewing.status as string}</Badge></div>
                <div><p className="text-muted-foreground">Estimated Cost</p><p className="font-medium">${(viewing.estimated_cost as number)?.toLocaleString() ?? '—'}</p></div>
              </div>
              {viewing.notes && <div><p className="text-muted-foreground">Notes</p><p>{viewing.notes as string}</p></div>}
              <div>
                <Label className="mb-2 block">Update Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'active', 'completed', 'cancelled'].map(s => (
                    <Button key={s} size="sm" variant={viewing.status === s ? 'default' : 'outline'} className="capitalize"
                      onClick={() => { updateStatusMutation.mutate({ id: viewing.id as string, status: s }); setViewing(null); }}>
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
