'use client';
import { useState } from 'react';
import { useEquipment, useCategories, EquipmentForm } from '@/hooks/use-equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-700 border-green-200',
  'rented-out': 'bg-blue-500/10 text-blue-700 border-blue-200',
  maintenance: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  damaged: 'bg-red-500/10 text-red-700 border-red-200',
  retired: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentForm>({
    name: '', description: '', serial_number: '', category_id: '', status: 'available',
    condition: 'good', location: '', pricing_type: 'fixed', fixed_rate: '',
    hourly_rate: '', min_rental_days: '1', security_deposit: '',
  });

  const { equipment, isLoading, createMutation, updateMutation, deleteMutation, EMPTY_FORM } = useEquipment();
  const { data: categories = [] } = useCategories();

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
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
    setOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, form }, { onSuccess: () => setOpen(false) });
    } else {
      createMutation.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  const filtered = (equipment as Record<string, unknown>[]).filter(e => {
    const matchSearch = !search || (e.name as string)?.toLowerCase().includes(search.toLowerCase()) || (e.serial_number as string)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const set = (k: keyof EquipmentForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">{(equipment as unknown[]).length} items in inventory</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Equipment</Button>
      </div>

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
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No equipment found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e.id as string} className="hover:shadow-md transition-shadow">
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
              <CardContent className="space-y-2">
                {e.description && <p className="text-sm text-muted-foreground line-clamp-2">{e.description as string}</p>}
                {e.location && <p className="text-xs text-muted-foreground">📍 {e.location as string}</p>}
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {e.pricing_type === 'fixed' && e.fixed_rate ? <span className="font-medium">${e.fixed_rate as number}/day</span> : null}
                    {e.pricing_type === 'hourly' && e.hourly_rate ? <span className="font-medium">${e.hourly_rate as number}/hr</span> : null}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete this equipment?')) deleteMutation.mutate(e.id as string); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle></DialogHeader>
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented-out">Rented Out</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
