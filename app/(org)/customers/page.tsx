'use client';
import { useState } from 'react';
import { useCustomers, CustomerForm } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, UserCheck, Mail, Phone } from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>({ name: '', type: 'small_business', email: '', phone: '', address: '', tax_number: '', notes: '' });

  const { customers, isLoading, createMutation, updateMutation, deleteMutation, EMPTY_FORM } = useCustomers(search);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (c: Record<string, unknown>) => {
    setEditingId(c.id as string);
    setForm({
      name: (c.name as string) || '',
      type: (c.type as string) || 'small_business',
      email: (c.email as string) || '',
      phone: (c.phone as string) || '',
      address: (c.address as string) || '',
      tax_number: (c.tax_number as string) || '',
      notes: (c.notes as string) || '',
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

  const set = (k: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">{(customers as unknown[]).length} customers</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-28 animate-pulse bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : (customers as unknown[]).length === 0 ? (
        <Card><CardContent className="py-12 text-center"><UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No customers found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(customers as Record<string, unknown>[]).map((c) => (
            <Card key={c.id as string}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.name as string}</CardTitle>
                    {c.type && <p className="text-xs text-muted-foreground capitalize">{(c.type as string).replace('_', ' ')}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Deactivate customer?')) deleteMutation.mutate(c.id as string); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {c.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{c.email as string}</div>}
                {c.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{c.phone as string}</div>}
                <div className="flex items-center justify-between pt-1">
                  <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">{c.status as string}</Badge>
                  <span className="text-xs text-muted-foreground">{(c.total_bookings as number) ?? 0} bookings</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Customer' : 'New Customer'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Name *</Label><Input value={form.name} onChange={set('name')} placeholder="John Smith" /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="small_business">Small Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={set('phone')} placeholder="+1 555-0000" /></div>
              <div className="space-y-2"><Label>Tax Number</Label><Input value={form.tax_number} onChange={set('tax_number')} placeholder="TAX-123" /></div>
              <div className="space-y-2 col-span-2"><Label>Address</Label><Input value={form.address} onChange={set('address')} placeholder="123 Main St" /></div>
              <div className="space-y-2 col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={set('notes')} placeholder="Additional notes" /></div>
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
