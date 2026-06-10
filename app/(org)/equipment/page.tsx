'use client';
import { useState } from 'react';
import { useEquipment, useCategories, EquipmentForm } from '@/hooks/use-equipment';
import { useEquipmentUnits } from '@/hooks/use-equipment-units';
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
  Plus, Pencil, Trash2, Search, Package, Layers,
  CheckCircle2, ChevronRight, ChevronLeft, MapPin,
  DollarSign, Grid3X3, List, Tag, Wrench, AlertTriangle,
  Clock, BarChart2,
} from 'lucide-react';

/* ─── Status helpers ───────────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  available:   { label: 'Available',   bg: 'bg-green-500/10',  text: 'text-green-600 dark:text-green-400',  border: 'border-green-500/25', dot: '#22c55e' },
  'rented-out':{ label: 'Rented Out',  bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-500/25',  dot: '#3b82f6' },
  maintenance: { label: 'Maintenance', bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/25', dot: '#f59e0b' },
  damaged:     { label: 'Damaged',     bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',      border: 'border-red-500/25',   dot: '#ef4444' },
  retired:     { label: 'Retired',     bg: 'bg-gray-500/10',   text: 'text-gray-500',                       border: 'border-gray-500/20',  dot: '#9ca3af' },
};

const CONDITION_META: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-500' },
  good:      { label: 'Good',      color: 'text-blue-500'  },
  fair:      { label: 'Fair',      color: 'text-amber-500' },
  poor:      { label: 'Poor',      color: 'text-red-500'   },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function EquipmentPage() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [view, setView]             = useState<'grid' | 'table'>('table');
  const [open, setOpen]             = useState(false);
  const [step, setStep]             = useState<1 | 2>(1);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [qty, setQty]               = useState('1');
  const [skuRows, setSkuRows]       = useState<{ sku_code: string; notes: string }[]>([{ sku_code: '', notes: '' }]);
  const [unitsModalId, setUnitsModalId]     = useState<string | null>(null);
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

  const openAdd = () => {
    setEditingId(null); setForm(EMPTY_FORM); setQty('1');
    setSkuRows([{ sku_code: '', notes: '' }]);
    setStep(1); setOpen(true);
  };
  const openEdit = (e: Record<string, unknown>) => {
    setEditingId(e.id as string);
    setForm({
      name: (e.name as string) || '', description: (e.description as string) || '',
      serial_number: (e.serial_number as string) || '', category_id: (e.category_id as string) || '',
      status: (e.status as string) || 'available', condition: (e.condition as string) || 'good',
      location: (e.location as string) || '', pricing_type: (e.pricing_type as string) || 'fixed',
      fixed_rate: e.fixed_rate != null ? String(e.fixed_rate) : '',
      hourly_rate: e.hourly_rate != null ? String(e.hourly_rate) : '',
      min_rental_days: e.min_rental_days != null ? String(e.min_rental_days) : '1',
      security_deposit: e.security_deposit != null ? String(e.security_deposit) : '',
    });
    setStep(1); setOpen(true);
  };

  const handleQtyChange = (val: string) => {
    setQty(val);
    const n = Math.max(1, Math.min(100, parseInt(val) || 1));
    setSkuRows(prev => {
      const rows = [...prev];
      while (rows.length < n) rows.push({ sku_code: '', notes: '' });
      return rows.slice(0, n);
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, form }, { onSuccess: () => setOpen(false) });
    } else {
      const skus = skuRows.filter(r => r.sku_code.trim());
      createMutation.mutate({ ...form, skus } as EquipmentForm & { skus: typeof skus }, {
        onSuccess: () => setOpen(false),
      });
    }
  };

  const set = (k: keyof EquipmentForm) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }));

  const isPending = createMutation.isPending || updateMutation.isPending;

  const all = equipment as Record<string, unknown>[];
  const filtered = all.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || (e.name as string)?.toLowerCase().includes(q)
      || (e.serial_number as string)?.toLowerCase().includes(q)
      || (e.location as string)?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Summary counts */
  const counts = {
    total:       all.length,
    available:   all.filter(e => e.status === 'available').length,
    rented:      all.filter(e => e.status === 'rented-out').length,
    maintenance: all.filter(e => e.status === 'maintenance').length,
    damaged:     all.filter(e => e.status === 'damaged').length,
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Equipment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{all.length} models in inventory</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"
          style={{ background: 'var(--accent-color)' }}>
          <Plus className="h-4 w-4" />Add Equipment
        </Button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: counts.total,       icon: Package,       cls: '' },
          { label: 'Available',   value: counts.available,   icon: CheckCircle2,  cls: 'text-green-500' },
          { label: 'Rented Out',  value: counts.rented,      icon: Clock,         cls: 'text-blue-500'  },
          { label: 'Maintenance', value: counts.maintenance, icon: Wrench,        cls: 'text-amber-500' },
          { label: 'Damaged',     value: counts.damaged,     icon: AlertTriangle, cls: 'text-red-500'   },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <Icon className={`h-4 w-4 shrink-0 ${cls || 'text-muted-foreground'}`} />
            <div>
              <p className="text-lg font-semibold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9 bg-card" placeholder="Search by name, serial, location…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-40 h-9 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_META).map(([v, m]) =>
              <SelectItem key={v} value={v}>{m.label}</SelectItem>
            )}
          </SelectContent>
        </Select>
        {/* View toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button onClick={() => setView('table')}
            className={`px-3 h-9 flex items-center gap-1.5 text-sm transition-colors ${view === 'table' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/60'}`}
            style={view === 'table' ? { background: 'var(--accent-color)', color: 'white' } : {}}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView('grid')}
            className={`px-3 h-9 flex items-center gap-1.5 text-sm transition-colors ${view === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/60'}`}
            style={view === 'grid' ? { background: 'var(--accent-color)', color: 'white' } : {}}>
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) =>
            <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No equipment found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter</p>
        </div>

      ) : view === 'table' ? (
        /* ── TABLE VIEW ── */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-border">
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => {
                const totalUnits = Number(e.total_units ?? 0);
                const availUnits = Number(e.available_units ?? 0);
                const cond = CONDITION_META[e.condition as string] || CONDITION_META.good;
                return (
                  <TableRow key={e.id as string} className="border-border/60 hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground leading-tight">{e.name as string}</p>
                          {e.serial_number && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{e.serial_number as string}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.category_name ? (
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />{e.category_name as string}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-28">{e.location as string}</span>
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {(e.pricing_type === 'fixed' && e.fixed_rate) ? (
                        <span className="text-sm font-medium font-mono">
                          ${Number(e.fixed_rate).toFixed(0)}<span className="text-xs text-muted-foreground font-sans">/day</span>
                        </span>
                      ) : (e.pricing_type === 'hourly' && e.hourly_rate) ? (
                        <span className="text-sm font-medium font-mono">
                          ${Number(e.hourly_rate).toFixed(0)}<span className="text-xs text-muted-foreground font-sans">/hr</span>
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      {totalUnits > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${totalUnits > 0 ? (availUnits / totalUnits) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{availUnits}/{totalUnits}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">No SKUs</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${cond.color}`}>{cond.label}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.status as string} />
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Manage SKU units"
                          onClick={() => { setUnitsModalId(e.id as string); setUnitsModalName(e.name as string); setNewSkus([{ sku_code: '', notes: '' }]); }}>
                          <Layers className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(e)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => { if (confirm('Delete this equipment?')) deleteMutation.mutate(e.id as string); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(e => {
            const totalUnits = Number(e.total_units ?? 0);
            const availUnits = Number(e.available_units ?? 0);
            const rentedUnits = Number(e.rented_units ?? 0);
            const maintUnits = Number(e.maintenance_units ?? 0);
            return (
              <div key={e.id as string}
                className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-border/80 hover:shadow-sm transition-all">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight truncate">{e.name as string}</p>
                      {e.category_name && (
                        <p className="text-xs text-muted-foreground truncate">{e.category_name as string}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={e.status as string} />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {e.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />{e.location as string}
                    </span>
                  )}
                  {e.serial_number && (
                    <span className="text-xs text-muted-foreground font-mono">{e.serial_number as string}</span>
                  )}
                </div>

                {/* Unit counts */}
                {totalUnits > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { label: 'Total',  val: totalUnits,  cls: 'text-foreground'       },
                      { label: 'Free',   val: availUnits,  cls: 'text-green-500'        },
                      { label: 'Rented', val: rentedUnits, cls: 'text-blue-500'         },
                      { label: 'Maint',  val: maintUnits,  cls: 'text-amber-500'        },
                    ].map(({ label, val, cls }) => (
                      <div key={label} className="bg-muted/40 rounded-md py-2">
                        <p className={`text-sm font-semibold leading-none ${cls}`}>{val}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing + actions */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/60">
                  <span className="text-sm font-medium font-mono text-foreground">
                    {e.pricing_type === 'fixed' && e.fixed_rate ? `$${Number(e.fixed_rate).toFixed(0)}/day` : ''}
                    {e.pricing_type === 'hourly' && e.hourly_rate ? `$${Number(e.hourly_rate).toFixed(0)}/hr` : ''}
                    {!e.fixed_rate && !e.hourly_rate ? <span className="text-muted-foreground">No price set</span> : ''}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Manage SKU units"
                      onClick={() => { setUnitsModalId(e.id as string); setUnitsModalName(e.name as string); setNewSkus([{ sku_code: '', notes: '' }]); }}>
                      <Layers className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => { if (confirm('Delete this equipment?')) deleteMutation.mutate(e.id as string); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ADD / EDIT EQUIPMENT DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">

          {/* Dialog header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md flex items-center justify-center"
                style={{ background: 'var(--accent-color)' }}>
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {editingId ? 'Edit Equipment' : step === 1 ? 'Add Equipment' : 'Enter SKU Codes'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editingId ? 'Update equipment details' : step === 1 ? 'Step 1 of 2 — Equipment details' : `Step 2 of 2 — ${qty} unit${Number(qty) !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {/* Step indicator */}
            {!editingId && (
              <div className="flex items-center gap-2 mt-3">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step === s ? 'text-white' : step > s ? 'text-white' : 'text-muted-foreground bg-muted'}`}
                      style={step >= s ? { background: 'var(--accent-color)' } : {}}>
                      {step > s ? '✓' : s}
                    </div>
                    <span className={`text-xs ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Details' : 'SKU Units'}
                    </span>
                    {s < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 1 ? (
              <div className="space-y-5">

                {/* Basic info */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Basic Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-sm">Equipment Name <span className="text-red-500">*</span></Label>
                      <Input value={form.name} onChange={set('name')} placeholder="e.g. Excavator CAT 320" className="h-9" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-sm">Description</Label>
                      <Textarea value={form.description} onChange={set('description')}
                        placeholder="Brief description of the equipment…"
                        className="resize-none text-sm" rows={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Serial Number</Label>
                      <Input value={form.serial_number} onChange={set('serial_number')} placeholder="SN-001" className="h-9 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Location</Label>
                      <Input value={form.location} onChange={set('location')} placeholder="Warehouse A" className="h-9" />
                    </div>
                  </div>
                </div>

                {/* Classification */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Classification</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Category</Label>
                      <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {(categories as { id: string; name: string }[]).map(c =>
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Condition</Label>
                      <Select value={form.condition} onValueChange={v => setForm(p => ({ ...p, condition: v }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingId && (
                      <div className="space-y-1.5">
                        <Label className="text-sm">Status</Label>
                        <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_META).map(([v, m]) =>
                              <SelectItem key={v} value={v}>{m.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Pricing Type</Label>
                      <Select value={form.pricing_type} onValueChange={v => setForm(p => ({ ...p, pricing_type: v }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed (Daily Rate)</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.pricing_type === 'fixed' && (
                      <div className="space-y-1.5">
                        <Label className="text-sm">Daily Rate ($)</Label>
                        <Input type="number" value={form.fixed_rate} onChange={set('fixed_rate')} placeholder="0.00" className="h-9 font-mono" />
                      </div>
                    )}
                    {form.pricing_type === 'hourly' && (
                      <div className="space-y-1.5">
                        <Label className="text-sm">Hourly Rate ($)</Label>
                        <Input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} placeholder="0.00" className="h-9 font-mono" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Min Rental Days</Label>
                      <Input type="number" value={form.min_rental_days} onChange={set('min_rental_days')} placeholder="1" className="h-9 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Security Deposit ($)</Label>
                      <Input type="number" value={form.security_deposit} onChange={set('security_deposit')} placeholder="0.00" className="h-9 font-mono" />
                    </div>
                  </div>
                </div>

                {/* Quantity — new only */}
                {!editingId && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Physical Units</p>
                    <div className="flex items-end gap-4">
                      <div className="space-y-1.5 w-36">
                        <Label className="text-sm">Quantity</Label>
                        <Input type="number" min="1" max="100" value={qty}
                          onChange={ev => handleQtyChange(ev.target.value)}
                          placeholder="1" className="h-9 font-mono" />
                      </div>
                      <p className="text-xs text-muted-foreground pb-1.5">
                        You'll assign a unique SKU code to each unit on the next step.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            ) : (
              /* Step 2 — SKU entry */
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter a unique SKU / asset tag for each physical unit. Leave unused rows blank.
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">SKU / Asset Tag</div>
                    <div className="col-span-6">Notes (optional)</div>
                  </div>
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {skuRows.map((row, i) => (
                      <div key={i} className="grid grid-cols-12 items-center px-4 py-2 gap-2">
                        <div className="col-span-1 text-xs text-muted-foreground font-mono">{i + 1}</div>
                        <div className="col-span-5">
                          <Input value={row.sku_code} placeholder={`SKU-${String(i + 1).padStart(3, '0')}`}
                            onChange={ev => setSkuRows(prev => prev.map((r, j) => j === i ? { ...r, sku_code: ev.target.value } : r))}
                            className="h-8 font-mono uppercase text-xs" />
                        </div>
                        <div className="col-span-6">
                          <Input value={row.notes} placeholder="Optional notes"
                            onChange={ev => setSkuRows(prev => prev.map((r, j) => j === i ? { ...r, notes: ev.target.value } : r))}
                            className="h-8 text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 shrink-0 bg-muted/20">
            <Button variant="outline" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
            <div className="flex gap-2">
              {step === 2 && (
                <Button variant="outline" className="h-9" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Back
                </Button>
              )}
              {!editingId && step === 1 ? (
                <Button className="h-9 px-5" disabled={!form.name}
                  style={{ background: 'var(--accent-color)' }}
                  onClick={() => setStep(2)}>
                  Next — SKU Codes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button className="h-9 px-5" onClick={handleSave}
                  disabled={!form.name || isPending}
                  style={{ background: 'var(--accent-color)' }}>
                  {isPending ? 'Saving…' : editingId ? 'Save Changes' : 'Create Equipment'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          MANAGE SKU UNITS DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!unitsModalId} onOpenChange={v => { if (!v) setUnitsModalId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">SKU Units</h2>
                <p className="text-xs text-muted-foreground">{unitsModalName}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Existing units */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Existing Units
                </p>
                <span className="text-xs text-muted-foreground">{(units as unknown[]).length} total</span>
              </div>
              {(units as Record<string, unknown>[]).length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <Layers className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No units yet</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="col-span-3">SKU Code</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-5">Notes / Booking</div>
                    <div className="col-span-1" />
                  </div>
                  <div className="divide-y divide-border">
                    {(units as Record<string, unknown>[]).map(u => (
                      <div key={u.id as string} className="grid grid-cols-12 items-center px-4 py-2.5 gap-2 hover:bg-muted/20 transition-colors">
                        <div className="col-span-3 font-mono text-sm font-semibold text-foreground">
                          {u.sku_code as string}
                        </div>
                        <div className="col-span-3">
                          <Select value={u.status as string}
                            onValueChange={v => updateUnitMutation.mutate({ unitId: u.id as string, data: { sku_code: u.sku_code as string, status: v, notes: (u.notes as string) || '' } })}>
                            <SelectTrigger className="h-7 text-xs border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['available','rented-out','maintenance','damaged','retired'].map(s =>
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5 text-xs text-muted-foreground truncate">
                          {(u.active_booking_info as string) || (u.notes as string) || '—'}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => { if (confirm('Delete this unit?')) deleteUnitMutation.mutate(u.id as string); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add units */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add More Units</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <div className="col-span-5">SKU / Asset Tag</div>
                  <div className="col-span-6">Notes (optional)</div>
                  <div className="col-span-1" />
                </div>
                {newSkus.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-4 py-2 gap-2 border-t border-border first:border-0">
                    <div className="col-span-5">
                      <Input value={row.sku_code} placeholder="SKU-001"
                        onChange={ev => setNewSkus(prev => prev.map((r, j) => j === i ? { ...r, sku_code: ev.target.value } : r))}
                        className="h-8 font-mono uppercase text-xs" />
                    </div>
                    <div className="col-span-6">
                      <Input value={row.notes} placeholder="Notes"
                        onChange={ev => setNewSkus(prev => prev.map((r, j) => j === i ? { ...r, notes: ev.target.value } : r))}
                        className="h-8 text-xs" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {newSkus.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => setNewSkus(prev => prev.filter((_, j) => j !== i))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="h-8 text-xs"
                  onClick={() => setNewSkus(prev => [...prev, { sku_code: '', notes: '' }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Row
                </Button>
                <Button size="sm" className="h-8 text-xs"
                  style={{ background: 'var(--accent-color)' }}
                  disabled={createUnitsMutation.isPending || !newSkus.some(r => r.sku_code.trim())}
                  onClick={() => {
                    const skus = newSkus.filter(r => r.sku_code.trim());
                    if (!skus.length) return;
                    createUnitsMutation.mutate({ equipmentId: unitsModalId!, skus }, {
                      onSuccess: () => setNewSkus([{ sku_code: '', notes: '' }]),
                    });
                  }}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {createUnitsMutation.isPending ? 'Saving…' : 'Save Units'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
