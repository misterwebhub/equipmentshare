'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
  invoicesApi, resource, lifecycleApi, downloadDocumentPdf, type Invoice,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  MoreVertical, Receipt, DollarSign, Download, Mail, CheckCircle,
} from 'lucide-react';

const customersApi = resource<any>('customers');

const statusColors: Record<string, string> = {
  unpaid: 'bg-status-damaged/10 text-status-damaged',
  partial: 'bg-amber-500/10 text-amber-600',
  paid: 'bg-status-available/10 text-status-available',
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const fmtDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};
const isOverdue = (inv: Invoice) => {
  if (inv.status === 'paid' || !inv.dueDate) return false;
  const d = new Date(inv.dueDate);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([invoicesApi.list(), customersApi.list().catch(() => [])])
      .then(([inv, c]) => { setItems(inv); setCustomers(c); })
      .catch((err) => toast({ title: 'Error loading invoices', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || '—';
  const filtered = items.filter((i) => statusFilter === 'all' || i.status === statusFilter);

  const totals = {
    outstanding: items.reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0),
    collected: items.reduce((s, i) => s + (i.amountPaid || 0), 0),
  };

  const openPay = (inv: Invoice) => {
    const balance = Math.max(0, (inv.total || 0) - (inv.amountPaid || 0));
    setPayAmount(balance.toFixed(2));
    setPayTarget(inv);
  };

  const submitPay = async () => {
    if (!payTarget) return;
    setPaySaving(true);
    try {
      const amt = payAmount === '' ? undefined : Number(payAmount);
      await invoicesApi.pay(payTarget.id, amt);
      toast({ title: 'Payment recorded' });
      setPayTarget(null);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setPaySaving(false);
    }
  };

  const sendEmail = async (inv: Invoice) => {
    setBusyId(inv.id);
    try {
      const res = await lifecycleApi.email('invoice', inv.id);
      toast({
        title: res.simulated ? 'Email simulated' : 'Email sent',
        description: res.simulated
          ? `SMTP not configured — logged to ${res.to}.`
          : `Sent to ${res.to}.`,
      });
    } catch (e: any) {
      toast({ title: 'Email failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const downloadPdf = async (inv: Invoice) => {
    try {
      await downloadDocumentPdf('invoice', inv.id, inv.number || inv.id);
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppShell title="Invoices">
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-border p-5">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{money(totals.outstanding)}</p>
          </Card>
          <Card className="border-border p-5">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="mt-1 text-2xl font-bold text-status-available">{money(totals.collected)}</p>
          </Card>
        </div>

        <div className="w-full md:w-56">
          <Label className="mb-2 block text-sm text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-border p-12 text-center">
            <Receipt className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No invoices yet. Generate one from an order.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Number</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Due</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Paid</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const balance = Math.max(0, (inv.total || 0) - (inv.amountPaid || 0));
                    return (
                      <tr key={inv.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium text-foreground">{inv.number}</td>
                        <td className="px-4 py-3 text-foreground">{customerName(inv.customerId)}</td>
                        <td className="px-4 py-3">
                          <span className={isOverdue(inv) ? 'text-status-damaged font-medium' : 'text-muted-foreground'}>
                            {fmtDate(inv.dueDate)}{isOverdue(inv) ? ' (overdue)' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{money(inv.total)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{money(inv.amountPaid)}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{money(balance)}</td>
                        <td className="px-4 py-3"><Badge className={statusColors[inv.status] || ''}>{inv.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busyId === inv.id}>
                                {busyId === inv.id ? <Spinner className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {inv.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => openPay(inv)}>
                                  <DollarSign className="mr-2 h-4 w-4" /> Record payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => downloadPdf(inv)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => sendEmail(inv)}>
                                <Mail className="mr-2 h-4 w-4" /> Email to customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment — {payTarget?.number}</DialogTitle>
            <DialogDescription>
              Balance due: {payTarget && money(Math.max(0, (payTarget.total || 0) - (payTarget.amountPaid || 0)))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="block">Amount</Label>
            <Input type="number" min={0} step="0.01" value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="bg-card border-border" />
            <p className="text-xs text-muted-foreground">Leave as-is to pay the full balance.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={submitPay} disabled={paySaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {paySaving ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
