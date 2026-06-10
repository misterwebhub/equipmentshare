'use client';
import { useState } from 'react';
import { useMaintenance, MaintenanceForm } from '@/hooks/use-maintenance';
import { useEquipment } from '@/hooks/use-equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Wrench, CheckCircle } from 'lucide-react';
import { useOrgFormat } from '@/lib/org-format';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-green-500/10 text-green-700 border-green-200',
  overdue: 'bg-red-500/10 text-red-700 border-red-200',
};

export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MaintenanceForm>({ equipment_id: '', type: 'preventive', frequency: 'monthly', scheduled_date: '', description: '', cost: '' });
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ notes: '', cost: '', next_due_date: '' });

  const { schedules, isLoading, createMutation, updateMutation, deleteMutation, completeMutation, EMPTY_FORM } = useMaintenance(statusFilter);
  const { equipment } = useEquipment();
  const { formatCurrency, formatDate } = useOrgFormat();

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (m: Record<string, unknown>) => {
    setEditingId(m.id as string);
    setForm({
      equipment_id: (m.equipment_id as string) || '',
      type: (m.type as string) || 'preventive',
      frequency: (m.frequency as string) || 'monthly',
      scheduled_date: ((m.scheduled_date as string) || '').slice(0, 10),
      description: (m.description as string) || '',
      cost: m.cost != null ? String(m.cost) : '',
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

  const handleComplete = () => {
    if (!completeId) return;
    completeMutation.mutate({
      id: completeId,
      notes: completeForm.notes,
      cost: completeForm.cost ? Number(completeForm.cost) : 0,
      next_due_date: completeForm.next_due_date || undefined,
    }, { onSuccess: () => setCompleteId(null) });
  };

  const set = (k: keyof MaintenanceForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const filtered = (schedules as Record<string, unknown>[]).filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.equipment_name as string)?.toLowerCase().includes(q) || (m.description as string)?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Equipment maintenance schedules</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Schedule Maintenance</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No maintenance records found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id as string}>
                  <TableCell className="font-medium">{m.equipment_name as string}</TableCell>
                  <TableCell className="capitalize">{(m.type as string)?.replace('_', ' ')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(m.scheduled_date as string)}</TableCell>
                  <TableCell className="capitalize text-sm">{m.frequency as string}</TableCell>
                  <TableCell>{m.cost ? formatCurrency(m.cost) : '—'}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize border ${STATUS_COLORS[m.status as string] || ''}`} variant="outline">{(m.status as string)?.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {m.status !== 'completed' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Mark complete"
                          onClick={() => { setCompleteId(m.id as string); setCompleteForm({ notes: '', cost: m.cost ? String(m.cost) : '', next_due_date: '' }); }}>
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(m.id as string); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Schedule'} Maintenance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipment *</Label>
              <Select value={form.equipment_id} onValueChange={(v) => setForm(p => ({ ...p, equipment_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>{(equipment as Record<string, unknown>[]).map(e => <SelectItem key={e.id as string} value={e.id as string}>{e.name as string}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm(p => ({ ...p, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={set('description')} placeholder="Describe the maintenance task" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Scheduled Date *</Label><Input type="date" value={form.scheduled_date} onChange={set('scheduled_date')} /></div>
              <div className="space-y-2"><Label>Estimated Cost ($)</Label><Input type="number" value={form.cost} onChange={set('cost')} placeholder="0.00" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.equipment_id || !form.scheduled_date || isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeId} onOpenChange={() => setCompleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Maintenance Complete</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Actual Cost ($)</Label><Input type="number" value={completeForm.cost} onChange={e => setCompleteForm(p => ({ ...p, cost: e.target.value }))} placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Next Due Date</Label><Input type="date" value={completeForm.next_due_date} onChange={e => setCompleteForm(p => ({ ...p, next_due_date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={completeForm.notes} onChange={e => setCompleteForm(p => ({ ...p, notes: e.target.value }))} placeholder="Completion notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteId(null)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={completeMutation.isPending}>{completeMutation.isPending ? 'Saving...' : 'Mark Complete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
