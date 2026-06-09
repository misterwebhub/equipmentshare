'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HeartPulse, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ConditionReport {
  id: string;
  equipment_name: string;
  unit_sku?: string;
  damage_level: string;
  description: string;
  status: string;
  repair_required: number;
  repair_cost: number;
  reporter_name?: string;
  created_at: string;
  resolved_at?: string;
}

interface StatsData {
  summary: {
    total: number;
    none_count: number;
    minor: number;
    moderate: number;
    severe: number;
    open_count: number;
    resolved: number;
    total_repair_cost: number;
  };
  by_equipment: { name: string; reports: number; repair_cost: number }[];
}

function useConditionReports(filters: Record<string, string> = {}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['condition-reports', filters],
    queryFn: async () => {
      const p = new URLSearchParams(filters);
      const { data } = await api.get(`/condition-reports?${p}`);
      return data.data as ConditionReport[];
    },
  });
  const stats = useQuery({
    queryKey: ['condition-reports-stats'],
    queryFn: async () => {
      const { data } = await api.get('/condition-reports/stats');
      return data.data as StatsData;
    },
  });
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/condition-reports', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['condition-reports'] });
      toast.success('Report submitted');
    },
    onError: () => toast.error('Failed to submit report'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status, repair_cost }: { id: string; status: string; repair_cost?: number }) =>
      api.patch(`/condition-reports/${id}/status`, { status, repair_cost }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['condition-reports'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Update failed'),
  });
  return { query, stats, createMutation, updateMutation };
}

function useEquipmentList() {
  return useQuery({
    queryKey: ['equipment-simple'],
    queryFn: async () => {
      const { data } = await api.get('/equipment');
      return data.data as { id: string; name: string }[];
    },
  });
}

const DAMAGE_COLORS: Record<string, string> = {
  none: 'oklch(0.76 0.22 155)',
  minor: 'oklch(0.80 0.22 90)',
  moderate: 'oklch(0.68 0.26 30)',
  severe: 'oklch(0.65 0.30 20)',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'oklch(0.68 0.26 30)',
  in_review: 'oklch(0.80 0.22 90)',
  resolved: 'oklch(0.76 0.22 155)',
};

export default function EquipmentHealthPage() {
  const [filters, setFilters] = useState<Record<string, string>>({} as Record<string, string>);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ equipment_id: '', damage_level: 'minor', description: '', repair_required: false, repair_cost: '' });
  const { query, stats, createMutation, updateMutation } = useConditionReports(filters);
  const equipList = useEquipmentList();

  const s = stats.data?.summary;

  async function handleCreate() {
    if (!form.equipment_id) return toast.error('Select equipment');
    await createMutation.mutateAsync({ ...form, repair_cost: parseFloat(form.repair_cost) || 0 });
    setShowCreate(false);
    setForm({ equipment_id: '', damage_level: 'minor', description: '', repair_required: false, repair_cost: '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Equipment Health</h1>
          <p className="text-muted-foreground text-sm mt-1">Condition reports & damage tracking</p>
        </div>
        <Button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }} className="text-white gap-2">
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </div>

      {/* Stats */}
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: s.total, icon: HeartPulse, color: 'oklch(0.70 0.28 270)' },
            { label: 'Open', value: s.open_count, icon: Clock, color: 'oklch(0.68 0.26 30)' },
            { label: 'Severe', value: s.severe, icon: AlertTriangle, color: 'oklch(0.65 0.30 20)' },
            { label: 'Repair Cost', value: `$${Number(s.total_repair_cost).toLocaleString()}`, icon: CheckCircle, color: 'oklch(0.76 0.22 155)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'All', val: {} as Record<string, string> },
          { label: 'Open', val: { status: 'open' } as Record<string, string> },
          { label: 'In Review', val: { status: 'in_review' } as Record<string, string> },
          { label: 'Resolved', val: { status: 'resolved' } as Record<string, string> },
          { label: 'Severe', val: { damage_level: 'severe' } as Record<string, string> },
          { label: 'Moderate', val: { damage_level: 'moderate' } as Record<string, string> },
        ].map(({ label, val }) => (
          <Button key={label} variant="outline" size="sm"
            className={JSON.stringify(filters) === JSON.stringify(val) ? 'border-primary text-primary' : ''}
            onClick={() => setFilters(val)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Reports Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Equipment</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Damage</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Repair Cost</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Reported</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : (query.data || []).length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No reports found</td></tr>
                ) : (query.data || []).map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.equipment_name}</td>
                    <td className="p-3">
                      {r.unit_sku ? (
                        <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: 'oklch(0.70 0.28 270 / 0.15)', color: 'oklch(0.70 0.28 270)' }}>
                          {r.unit_sku}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge className="text-xs capitalize" style={{ background: `${DAMAGE_COLORS[r.damage_level]}20`, color: DAMAGE_COLORS[r.damage_level], border: `1px solid ${DAMAGE_COLORS[r.damage_level]}40` }}>
                        {r.damage_level}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground">{r.description || '—'}</td>
                    <td className="p-3">{r.repair_cost > 0 ? `$${r.repair_cost}` : '—'}</td>
                    <td className="p-3">
                      <Badge className="text-xs capitalize" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status], border: `1px solid ${STATUS_COLORS[r.status]}40` }}>
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      {r.status !== 'resolved' && (
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => updateMutation.mutate({ id: r.id, status: r.status === 'open' ? 'in_review' : 'resolved' })}>
                          {r.status === 'open' ? 'Review' : 'Resolve'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* By Equipment */}
      {(stats.data?.by_equipment || []).length > 0 && (
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-sm">Reports by Equipment (Top 10)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(stats.data?.by_equipment || []).map((e) => (
                <div key={e.name} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <span className="text-sm font-medium">{e.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{e.reports} reports</span>
                    {e.repair_cost > 0 && <span style={{ color: 'oklch(0.68 0.26 30)' }}>${Number(e.repair_cost).toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Condition Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Equipment *</label>
              <Select value={form.equipment_id} onValueChange={v => setForm(f => ({ ...f, equipment_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>
                  {(equipList.data || []).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Damage Level</label>
              <Select value={form.damage_level} onValueChange={v => setForm(f => ({ ...f, damage_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['none','minor','moderate','severe'].map(d => (
                    <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the condition…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Repair Cost ($)</label>
                <Input type="number" value={form.repair_cost} onChange={e => setForm(f => ({ ...f, repair_cost: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.repair_required} onChange={e => setForm(f => ({ ...f, repair_required: e.target.checked }))} className="rounded" />
                  Repair Required
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}
                onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
