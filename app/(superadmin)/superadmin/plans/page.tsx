'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Users, Package, DollarSign } from 'lucide-react';

interface PlanForm {
  name: string;
  price_monthly: string;
  price_yearly: string;
  max_equipment: string;
  max_users: string;
  features: string;
  is_active: boolean;
}

const EMPTY_FORM: PlanForm = {
  name: '',
  price_monthly: '',
  price_yearly: '',
  max_equipment: '25',
  max_users: '3',
  features: '',
  is_active: true,
};

export default function PlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['superadmin-plans'],
    queryFn: async () => {
      const { data } = await api.get('/superadmin/plans');
      return data.data as Record<string, unknown>[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/superadmin/plans', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-plans'] }); toast.success('Plan created'); setOpen(false); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: Record<string, unknown>) => api.put(`/superadmin/plans/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-plans'] }); toast.success('Plan updated'); setOpen(false); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };

  const openEdit = (p: Record<string, unknown>) => {
    setEditingId(p.id as string);
    setForm({
      name: (p.name as string) || '',
      price_monthly: String(p.price_monthly ?? ''),
      price_yearly: String(p.price_yearly ?? ''),
      max_equipment: String(p.max_equipment ?? '25'),
      max_users: String(p.max_users ?? '3'),
      features: typeof p.features === 'string' ? p.features : JSON.stringify(p.features || {}),
      is_active: Boolean(p.is_active ?? true),
    });
    setOpen(true);
  };

  const handleSave = () => {
    let parsedFeatures: unknown = {};
    try { parsedFeatures = form.features ? JSON.parse(form.features) : {}; } catch { parsedFeatures = {}; }

    const payload = {
      name: form.name,
      price_monthly: Number(form.price_monthly) || 0,
      price_yearly: Number(form.price_yearly) || 0,
      max_equipment: Number(form.max_equipment) || 25,
      max_users: Number(form.max_users) || 3,
      features: parsedFeatures,
      is_active: form.is_active ? 1 : 0,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const set = (k: keyof PlanForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans available to organizations</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Plan</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(plans as Record<string, unknown>[]).map(plan => (
            <Card key={plan.id as string} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name as string}</CardTitle>
                  <div className="flex items-center gap-2">
                    {plan.is_active ? (
                      <Badge className="text-xs bg-green-500/10 text-green-700 border-green-200" variant="outline">Active</Badge>
                    ) : (
                      <Badge className="text-xs" variant="outline">Inactive</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-3xl font-bold">{(plan.price_monthly as number).toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm mb-1">/mo</span>
                </div>
                {(plan.price_yearly as number) > 0 && (
                  <p className="text-xs text-muted-foreground">${(plan.price_yearly as number).toLocaleString()}/year (save {Math.round(100 - ((plan.price_yearly as number) / ((plan.price_monthly as number) * 12)) * 100)}%)</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{(plan.max_equipment as number) >= 9999 ? 'Unlimited' : plan.max_equipment as number} equipment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{(plan.max_users as number) >= 9999 ? 'Unlimited' : plan.max_users as number} users</span>
                  </div>
                </div>
                {plan.features && typeof plan.features === 'object' && (
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    {Object.entries(plan.features as Record<string, unknown>)
                      .filter(([k]) => k !== 'label')
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className={typeof v === 'boolean' ? (v ? 'text-green-600' : 'text-red-500') : ''}>
                            {typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Starter, Professional, Enterprise" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price ($) *</Label>
                <Input type="number" value={form.price_monthly} onChange={set('price_monthly')} placeholder="49" />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price ($)</Label>
                <Input type="number" value={form.price_yearly} onChange={set('price_yearly')} placeholder="470" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Equipment</Label>
                <Input type="number" value={form.max_equipment} onChange={set('max_equipment')} placeholder="25" />
              </div>
              <div className="space-y-2">
                <Label>Max Users</Label>
                <Input type="number" value={form.max_users} onChange={set('max_users')} placeholder="3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features (JSON)</Label>
              <Input
                value={form.features}
                onChange={set('features')}
                placeholder='{"reports":true,"api":false}'
              />
              <p className="text-xs text-muted-foreground">Optional JSON object for feature flags</p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.price_monthly || isPending}>
              {isPending ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
