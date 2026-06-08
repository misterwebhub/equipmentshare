'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LineItemsEditor, type LineItemsValue } from '@/components/sales/line-items-editor';
import {
  quotationsApi, resource, lifecycleApi, downloadDocumentPdf, type Quotation,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, FileText, MoreVertical, Send, CheckCircle, XCircle, ArrowRightCircle,
  Download, Mail, Edit2, Trash2,
} from 'lucide-react';

const customersApi = resource<any>('customers');
const equipmentApi = resource<any>('equipment');

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-600',
  accepted: 'bg-status-available/10 text-status-available',
  rejected: 'bg-status-damaged/10 text-status-damaged',
  expired: 'bg-amber-500/10 text-amber-600',
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const fmtDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const blankForm = (): any => ({
  customerId: '',
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  notes: '',
  lineItems: [{ description: '', qty: 1, days: 1, rate: 0 }],
  discount: 0,
  taxRate: 0,
});

export default function QuotationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [form, setForm] = useState<any>(blankForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      quotationsApi.list(),
      customersApi.list().catch(() => []),
      equipmentApi.list().catch(() => []),
    ])
      .then(([q, c, e]) => { setItems(q); setCustomers(c); setEquipment(e); })
      .catch((err) => toast({ title: 'Error loading quotations', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || '—';
  const filtered = items.filter((q) => statusFilter === 'all' || q.status === statusFilter);

  const openCreate = () => { setEditing(null); setForm(blankForm()); setDialogOpen(true); };
  const openEdit = (q: Quotation) => {
    setEditing(q);
    setForm({
      customerId: q.customerId || '',
      issueDate: q.issueDate ? q.issueDate.slice(0, 10) : '',
      validUntil: q.validUntil ? q.validUntil.slice(0, 10) : '',
      notes: q.notes || '',
      lineItems: q.lineItems?.length ? q.lineItems : [{ description: '', qty: 1, days: 1, rate: 0 }],
      discount: q.discount || 0,
      // Backend stores taxRate as a fraction (0.1); the editor shows percent.
      taxRate: (q.taxRate || 0) * 100,
    });
    setDialogOpen(true);
  };

  const liValue: LineItemsValue = {
    lineItems: form.lineItems, discount: form.discount, taxRate: form.taxRate,
  };

  const save = async () => {
    if (!form.customerId) {
      toast({ title: 'Customer required', description: 'Pick a customer for this quotation.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      customerId: form.customerId,
      issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : undefined,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      notes: form.notes,
      lineItems: form.lineItems,
      discount: Number(form.discount) || 0,
      // Convert percent (UI) -> fraction (backend convention).
      taxRate: (Number(form.taxRate) || 0) / 100,
    };
    try {
      if (editing) {
        await quotationsApi.update(editing.id, payload);
        toast({ title: 'Quotation updated' });
      } else {
        await quotationsApi.create(payload);
        toast({ title: 'Quotation created' });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const withBusy = async (id: string, fn: () => Promise<any>, success: string) => {
    setBusyId(id);
    try {
      await fn();
      toast({ title: success });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (q: Quotation, status: string) =>
    withBusy(q.id, () => quotationsApi.setStatus(q.id, status), `Marked ${status}`);

  const convert = (q: Quotation) =>
    withBusy(q.id, () => quotationsApi.convert(q.id), `Converted to order`);

  const sendEmail = async (q: Quotation) => {
    setBusyId(q.id);
    try {
      const res = await lifecycleApi.email('quotation', q.id);
      toast({
        title: res.simulated ? 'Email simulated' : 'Email sent',
        description: res.simulated
          ? `SMTP not configured — logged to ${res.to}.`
          : `Sent to ${res.to}.`,
      });
      load();
    } catch (e: any) {
      toast({ title: 'Email failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const downloadPdf = async (q: Quotation) => {
    try {
      await downloadDocumentPdf('quotation', q.id, q.number || q.id);
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await quotationsApi.remove(deleteTarget.id);
      toast({ title: 'Quotation deleted' });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppShell title="Quotations">
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-56">
            <Label className="mb-2 block text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Quotation
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-border p-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No quotations yet. Create your first one.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Number</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Issued</th>
                    <th className="px-4 py-3 text-left font-medium">Valid Until</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{q.number}</td>
                      <td className="px-4 py-3 text-foreground">{customerName(q.customerId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(q.issueDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(q.validUntil)}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{money(q.total)}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[q.status] || ''}>{q.status}</Badge>
                        {q.convertedOrderId && (
                          <span className="ml-2 text-xs text-muted-foreground">→ order</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busyId === q.id}>
                              {busyId === q.id ? <Spinner className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(q)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadPdf(q)}>
                              <Download className="mr-2 h-4 w-4" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendEmail(q)}>
                              <Mail className="mr-2 h-4 w-4" /> Email to customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {q.status === 'draft' && (
                              <DropdownMenuItem onClick={() => setStatus(q, 'sent')}>
                                <Send className="mr-2 h-4 w-4" /> Mark as sent
                              </DropdownMenuItem>
                            )}
                            {q.status !== 'accepted' && (
                              <DropdownMenuItem onClick={() => setStatus(q, 'accepted')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark accepted
                              </DropdownMenuItem>
                            )}
                            {q.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => setStatus(q, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4" /> Mark rejected
                              </DropdownMenuItem>
                            )}
                            {!q.convertedOrderId && (
                              <DropdownMenuItem onClick={() => convert(q)}>
                                <ArrowRightCircle className="mr-2 h-4 w-4" /> Convert to order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(q)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.number}` : 'New Quotation'}</DialogTitle>
            <DialogDescription>
              Totals are recalculated on the server when you save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label className="mb-2 block">Customer</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Issue Date</Label>
                <Input type="date" value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="bg-card border-border" />
              </div>
              <div>
                <Label className="mb-2 block">Valid Until</Label>
                <Input type="date" value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className="bg-card border-border" />
              </div>
            </div>

            <LineItemsEditor
              value={liValue}
              onChange={(v) => setForm({ ...form, ...v })}
              equipment={equipment}
            />

            <div>
              <Label className="mb-2 block">Notes</Label>
              <Textarea value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Terms, delivery details, etc."
                className="bg-card border-border" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {editing ? 'Save changes' : 'Create quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.number}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the quotation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
