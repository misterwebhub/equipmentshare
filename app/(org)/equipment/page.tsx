'use client';
import { useState } from 'react';
import { useEquipment, useCategories, EquipmentForm } from '@/hooks/use-equipment';
import { useEquipmentUnits } from '@/hooks/use-equipment-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Package, ChevronRight, ChevronLeft, Layers, CheckCircle2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-400 border-green-500/30',
  'rented-out': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  damaged: 'bg-red-500/10 text-red-400 border-red-500/30',
  retired: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const UNIT_STATUS_COLORS: Record<string, string> = {
  available: 'text-green-400',
  'rented-out': 'text-blue-400',
  maintenance: 'text-yellow-400',
  damaged: 'text-red-400',
  retired: 'text-gray-400',
};

const UNIT_STATUS_OPTIONS = ['available', 'rented-out', 'maintenance', 'damaged', 'retired'];

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // step 1 = form, step 2 = SKU entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  const [skuRows, setSkuRows] = useState<{ sku_code: string; notes: string }[]>([]);

  // Units management modal
  const [unitsModalId, setUnitsModalId] = useState<string | null>(null);
  const [unitsModalName, setUnitsModalName] = useState('');
  const [newSkus, setNewSkus] = useState<{ sku_code: string; notes: string }[]>([{ sku_code: '', notes: '' }]);

  const [form, setForm] = useState<EquipmentForm>({
    name: '', description: '', serial_number: '', category_id: '', status: 'available',
    condition: 'good', location: '', pricing_type: 'fixed', fixed_rate: '',
    hourly_rate: '', min_rental_days: '1', security_deposit: '',
  });

  const { equipment, isLoading, createMutation, updateMutation, deleteMutation, EMPTY_FORM } = useEquipment();
  const { data: categories = [] } = useCategories();
  const { units, createUnitsMutation, updateUnitMutation, deleteUnitMutation } = useEquipmentUnits(unitsModalId);

  // ── Open helpers ──────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null); setForm(EMPTY_FORM); setQty('1');
    setSkuRows([{ sku_code: '', notes: '' }]);
    setStep(1); setOpen(true);
  };

  const openEdit = (e: Record<string, unknown>) => {
    setEditingId(e.id as string);
    setForm({
      name: (e.name as string) || '',
      description: (e.description as string) || '',
      serial_number: (e.serial_number as string) || '',
      category_id: (e.category_id as string) || '',
      status: (e.status as string) || 'available',
      condition: (e.condition as string) || 'good',
      location: (e.location as string) || '',
      pricing_type: (e.pricing_type as string) || 'fixed',
      fixed_rate: e.fixed_rate != null ? String(e.fixed_rate) : '',
      hourly_rate: e.hourly_rate != null ? String(e.hourly_rate) : '',
      min_rental_days: e.min_rental_days != null ? String(e.min_rental_days) : '1',
      security_deposit: e.security_deposit != null ? String(e.security_deposit) : '',
    });
    setStep(1); setOpen(true);
  };

  // ── Qty change → resize skuRows ──────────────────────────────
  const handleQtyChange = (val: string) => {
    setQty(val);
    const n = Math.max(1, Math.min(100, parseInt(val) || 1));
    setSkuRows(prev => {
      const rows = [...prev];
      while (rows.length < n) rows.push({ sku_code: '', notes: '' });
      return rows.slice(0, n);
    });
  };

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, form }, { onSuccess: () => setOpen(false) });
    } else {
      // Include SKUs from step 2
      const skus = skuRows.filter(r => r.sku_code.trim());
      createMutation.mutate({ ...form, skus } as EquipmentForm & { skus: typeof skus }, {
        onSuccess: () => setOpen(false),
      });
    }
  };

  // ── Filter ───────────────────────────────────────────────────
  const filtered = (equipment as Record<string, unknown>[]).filter(e => {
    const matchSearch = !search || (e.name as string)?.toLowerCase().includes(search.toLowerCase()) || (e.serial_number as string)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const set = (k: keyof EquipmentForm) => (ev: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: ev.target.value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Equipment</h1>
          <p className="text-muted-foreground">{(equipment as unknown[]).length} models in inventory</p>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search equipment..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented-out">Rented Out</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No equipment found</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => {
            const totalUnits = Number(e.total_units ?? 0);
            const availUnits = Number(e.available_units ?? 0);
            const rentedUnits = Number(e.rented_units ?? 0);
            const maintUnits = Number(e.maintenance_units ?? 0);
            return (
              <Card key={e.id as string} className="hover:shadow-lg transition-all border-border/50 hover:border-violet-500/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{e.name as string}</CardTitle>
                      {e.category_name && <p className="text-xs text-muted-foreground">{e.category_name as string}</p>}
                    </div>
                    <Badge className={`text-xs capitalize border shrink-0 ${STATUS_COLORS[e.status as string] || ''}`} variant="outline">
                      {(e.status as string).replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {e.location && <p className="text-xs text-muted-foreground">📍 {e.location as string}</p>}

                  {/* SKU Unit counts */}
                  {totalUnits > 0 && (
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div className="bg-muted/40 rounded p-1.5">
                        <p className="text-sm font-bold">{totalUnits}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="bg-green-500/10 rounded p-1.5">
                        <p className="text-sm font-bold text-green-400">{availUnits}</p>
                        <p className="text-[10px] text-green-500/70">Avail</p>
                      </div>
                      <div className="bg-blue-500/10 rounded p-1.5">
                        <p className="text-sm font-bold text-blue-400">{rentedUnits}</p>
                        <p className="text-[10px] text-blue-500/70">Rented</p>
                      </div>
                      <div className="bg-yellow-500/10 rounded p-1.5">
                        <p className="text-sm font-bold text-yellow-400">{maintUnits}</p>
                        <p className="text-[10px] text-yellow-500/70">Maint</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {e.pricing_type === 'fixed' && e.fixed_rate ? <span className="font-medium text-cyan-400">${e.fixed_rate as number}/day</span> : null}
                      {e.pricing_type === 'hourly' && e.hourly_rate ? <span className="font-medium text-cyan-400">${e.hourly_rate as number}/hr</span> : null}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-400 hover:text-violet-300" title="Manage SKU Units"
                        onClick={() => { setUnitsModalId(e.id as string); setUnitsModalName(e.name as string); setNewSkus([{ sku_code: '', notes: '' }]); }}>
                        <Layers className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => { if (confirm('Delete this equipment?')) deleteMutation.mutate(e.id as string); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Equipment Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Equipment' : step === 1 ? 'Add Equipment (1/2 — Details)' : `Add Equipment (2/2 — SKU Codes × ${qty})`}</DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2"><Label>Name *</Label><Input value={form.name} onChange={set('name')} placeholder="Excavator CAT 320" /></div>
                <div className="space-y-2 col-span-2"><Label>Description</Label><Input value={form.description} onChange={set('description')} placeholder="Brief description" /></div>
                <div className="space-y-2"><Label>Serial Number</Label><Input value={form.serial_number} onChange={set('serial_number')} placeholder="SN-001" /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={set('location')} placeholder="Warehouse A" /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm(p => ({ ...p, category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{(categories as { id: string; name: string }[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm(p => ({ ...p, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <div className="space-y-2"><Label>Daily Rate ($)</Label><Input type="number" value={form.fixed_rate} onChange={set('fixed_rate')} placeholder="0.00" /></div>
                )}
                {form.pricing_type === 'hourly' && (
                  <div className="space-y-2"><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} placeholder="0.00" /></div>
                )}
                <div className="space-y-2"><Label>Min Rental Days</Label><Input type="number" value={form.min_rental_days} onChange={set('min_rental_days')} placeholder="1" /></div>
                <div className="space-y-2"><Label>Security Deposit ($)</Label><Input type="number" value={form.security_deposit} onChange={set('security_deposit')} placeholder="0.00" /></div>

                {/* Quantity — only for new equipment */}
                {!editingId && (
                  <div className="space-y-2 col-span-2 border-t pt-4">
                    <Label className="text-violet-400">Quantity (how many physical units?)</Label>
                    <Input type="number" min="1" max="100" value={qty} onChange={(ev) => handleQtyChange(ev.target.value)} placeholder="1" />
                    <p className="text-xs text-muted-foreground">You'll enter a unique SKU code for each unit on the next step.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2 — SKU entry */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter a unique SKU code for each physical unit. Notes are optional.</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {skuRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <Input
                      placeholder={`SKU-${String(i + 1).padStart(3, '0')}`}
                      value={row.sku_code}
                      onChange={(ev) => setSkuRows(prev => prev.map((r, j) => j === i ? { ...r, sku_code: ev.target.value } : r))}
                      className="font-mono uppercase"
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={row.notes}
                      onChange={(ev) => setSkuRows(prev => prev.map((r, j) => j === i ? { ...r, notes: ev.target.value } : r))}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Back
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {!editingId && step === 1 ? (
              <Button onClick={() => setStep(2)} disabled={!form.name}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={!form.name || isPending}>
                {isPending ? 'Saving...' : editingId ? 'Save' : 'Create Equipment'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage SKU Units Dialog ── */}
      <Dialog open={!!unitsModalId} onOpenChange={(v) => { if (!v) setUnitsModalId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              SKU Units — {unitsModalName}
            </DialogTitle>
          </DialogHeader>

          {/* Existing units */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Existing Units ({(units as unknown[]).length})</p>
            {(units as Record<string, unknown>[]).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No units yet. Add some below.</p>
            ) : (
              <div className="space-y-1.5">
                {(units as Record<string, unknown>[]).map((u) => (
                  <div key={u.id as string} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                    <span className="font-mono text-sm font-semibold text-violet-300 w-28 shrink-0">{u.sku_code as string}</span>
                    <Select
                      value={u.status as string}
                      onValueChange={(v) => updateUnitMutation.mutate({ unitId: u.id as string, data: { sku_code: u.sku_code as string, status: v, notes: u.notes as string || '' } })}
                    >
                      <SelectTrigger className={`h-7 w-32 text-xs ${UNIT_STATUS_COLORS[u.status as string] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {u.active_booking_info && (
                      <span className="text-xs text-blue-400 flex-1 truncate">{u.active_booking_info as string}</span>
                    )}
                    {!u.active_booking_info && (
                      <span className="text-xs text-muted-foreground flex-1">{u.notes as string}</span>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => { if (confirm('Delete this SKU unit?')) deleteUnitMutation.mutate(u.id as string); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new units */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Add More Units</p>
            <div className="space-y-2">
              {newSkus.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="SKU code"
                    value={row.sku_code}
                    onChange={(ev) => setNewSkus(prev => prev.map((r, j) => j === i ? { ...r, sku_code: ev.target.value } : r))}
                    className="font-mono uppercase"
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={row.notes}
                    onChange={(ev) => setNewSkus(prev => prev.map((r, j) => j === i ? { ...r, notes: ev.target.value } : r))}
                  />
                  {newSkus.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => setNewSkus(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setNewSkus(prev => [...prev, { sku_code: '', notes: '' }])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Row
              </Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700"
                disabled={createUnitsMutation.isPending || !newSkus.some(r => r.sku_code.trim())}
                onClick={() => {
                  const skus = newSkus.filter(r => r.sku_code.trim());
                  if (!skus.length) return;
                  createUnitsMutation.mutate({ equipmentId: unitsModalId!, skus }, {
                    onSuccess: () => setNewSkus([{ sku_code: '', notes: '' }]),
                  });
                }}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {createUnitsMutation.isPending ? 'Saving...' : 'Save Units'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
