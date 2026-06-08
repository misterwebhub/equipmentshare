'use client';
import { useState } from 'react';
import { useSubscriptions, usePlans, useOrganisations } from '@/hooks/use-superadmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, CreditCard, XCircle, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  trial: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-500/10 text-red-700 border-red-200',
  expired: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

const EMPTY_FORM = { org_id: '', plan_id: '', billing_cycle: 'monthly', starts_at: '', ends_at: '', amount: '', status: 'active', notes: '' };

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { subscriptions, isLoading, createMutation, updateMutation, cancelMutation } = useSubscriptions();
  const { data: plans = [] } = usePlans();
  const { organisations } = useOrganisations();

  const openCreate = () => {
    setEditingId(null);
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextYear = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');
    setForm({ ...EMPTY_FORM, starts_at: today, ends_at: nextYear });
    setOpen(true);
  };

  const openEdit = (s: Record<string, unknown>) => {
    setEditingId(s.id as string);
    const plan = (plans as Record<string, unknown>[]).find(p => p.name === s.plan_name);
    setForm({
      org_id: s.org_id as string || '',
      plan_id: (plan?.id as string) || '',
      billing_cycle: (s.billing_cycle as string) || 'monthly',
      starts_at: ((s.starts_at as string) || '').slice(0, 10),
      ends_at: ((s.ends_at as string) || '').slice(0, 10),
      amount: s.amount != null ? String(s.amount) : '',
      status: (s.status as string) || 'active',
      notes: (s.notes as string) || '',
    });
    setOpen(true);
  };

  const handleSave = () => {
    const payload = {
      plan_id: form.plan_id,
      status: form.status,
      billing_cycle: form.billing_cycle,
      starts_at: form.starts_at,
      ends_at: form.ends_at || undefined,
      amount: form.amount ? Number(form.amount) : 0,
      notes: form.notes,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createMutation.mutate({ org_id: form.org_id, ...payload }, { onSuccess: () => setOpen(false) });
    }
  };

  const filtered = (subscriptions as Record<string, unknown>[]).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.org_name as string)?.toLowerCase().includes(q) || (s.plan_name as string)?.toLowerCase().includes(q);
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const activeCount = (subscriptions as Record<string, unknown>[]).filter(s => s.status === 'active').length;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage all organization subscriptions</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Manual Subscription</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Subscriptions</p><p className="text-2xl font-bold">{(subscriptions as unknown[]).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Cancelled</p><p className="text-2xl font-bold text-red-600">{(subscriptions as Record<string, unknown>[]).filter(s => s.status === 'cancelled').length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search subscriptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No subscriptions found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Ends</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id as string}>
                  <TableCell className="font-medium">{s.org_name as string}</TableCell>
                  <TableCell>{s.plan_name as string}</TableCell>
                  <TableCell className="capitalize text-sm">{s.billing_cycle as string}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.starts_at ? format(new Date(s.starts_at as string), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.ends_at ? format(new Date(s.ends_at as string), 'MMM d, yyyy') : 'Ongoing'}</TableCell>
                  <TableCell className="text-sm">{s.amount ? `$${(s.amount as number).toLocaleString()}` : '—'}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize border ${STATUS_COLORS[s.status as string] || ''}`} variant="outline">{s.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      {s.status === 'active' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Cancel"
                          onClick={() => { if (confirm('Cancel this subscription?')) cancelMutation.mutate(s.id as string); }}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Subscription' : 'Create Manual Subscription'}</DialogTitle>
            {!editingId && <p className="text-sm text-muted-foreground">Manually assign a plan to an organization, bypassing payment.</p>}
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div className="space-y-2">
                <Label>Organization *</Label>
                <Select value={form.org_id} onValueChange={(v) => setForm(p => ({ ...p, org_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>{(organisations as Record<string, unknown>[]).map(o => <SelectItem key={o.id as string} value={o.id as string}>{o.name as string}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select value={form.plan_id} onValueChange={(v) => {
                const plan = (plans as Record<string, unknown>[]).find(p => p.id === v);
                setForm(p => ({ ...p, plan_id: v, amount: plan?.price_monthly != null ? String(plan.price_monthly) : p.amount }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{(plans as Record<string, unknown>[]).map(p => <SelectItem key={p.id as string} value={p.id as string}>{p.name as string} — ${p.price_monthly as number}/mo</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select value={form.billing_cycle} onValueChange={(v) => setForm(p => ({ ...p, billing_cycle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.starts_at} onChange={set('starts_at')} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.ends_at} onChange={set('ends_at')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={set('notes')} placeholder="Reason for manual subscription..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.plan_id || !form.starts_at || (!editingId && !form.org_id) || isPending}>
              {isPending ? 'Saving...' : editingId ? 'Update' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
