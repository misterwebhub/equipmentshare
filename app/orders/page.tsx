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
import { ordersApi, resource, type Order } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  MoreVertical, CheckCircle, Truck, RotateCcw, XCircle, Receipt, ClipboardList, Eye,
} from 'lucide-react';

const customersApi = resource<any>('customers');

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-500/10 text-blue-600',
  fulfilled: 'bg-status-available/10 text-status-available',
  returned: 'bg-muted text-muted-foreground',
  cancelled: 'bg-status-damaged/10 text-status-damaged',
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const fmtDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);
  const [returnForm, setReturnForm] = useState({ lateDays: 0, lateRatePerDay: 0, damageAmount: 0, damageNote: '' });
  const [returnSaving, setReturnSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([ordersApi.list(), customersApi.list().catch(() => [])])
      .then(([o, c]) => { setItems(o); setCustomers(c); })
      .catch((err) => toast({ title: 'Error loading orders', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || '—';
  const filtered = items.filter((o) => statusFilter === 'all' || o.status === statusFilter);

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

  const setStatus = (o: Order, status: string) =>
    withBusy(o.id, () => ordersApi.setStatus(o.id, status), `Marked ${status}`);

  const generateInvoice = (o: Order) =>
    withBusy(o.id, () => ordersApi.generateInvoice(o.id), 'Invoice generated');

  const openReturn = (o: Order) => {
    setReturnForm({ lateDays: 0, lateRatePerDay: 0, damageAmount: 0, damageNote: '' });
    setReturnTarget(o);
  };

  const submitReturn = async () => {
    if (!returnTarget) return;
    setReturnSaving(true);
    try {
      const res = await ordersApi.recordReturn(returnTarget.id, {
        lateDays: Number(returnForm.lateDays) || 0,
        lateRatePerDay: Number(returnForm.lateRatePerDay) || 0,
        damageAmount: Number(returnForm.damageAmount) || 0,
        damageNote: returnForm.damageNote,
      });
      const n = res.charges?.length || 0;
      toast({
        title: 'Return recorded',
        description: n ? `${n} charge(s) added.` : 'No additional charges.',
      });
      setReturnTarget(null);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setReturnSaving(false);
    }
  };

  return (
    <AppShell title="Orders">
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-56">
            <Label className="mb-2 block text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Orders are created by converting an accepted quotation.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-border p-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet. Convert a quotation to create one.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Number</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Start</th>
                    <th className="px-4 py-3 text-left font-medium">End</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Invoice</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{o.number}</td>
                      <td className="px-4 py-3 text-foreground">{customerName(o.customerId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.endDate)}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{money(o.total)}</td>
                      <td className="px-4 py-3"><Badge className={statusColors[o.status] || ''}>{o.status}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.invoiceId ? <span className="text-status-available">Generated</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busyId === o.id}>
                              {busyId === o.id ? <Spinner className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewing(o)}>
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {o.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => setStatus(o, 'fulfilled')}>
                                <Truck className="mr-2 h-4 w-4" /> Mark fulfilled
                              </DropdownMenuItem>
                            )}
                            {o.status !== 'returned' && o.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => openReturn(o)}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Record return & charges
                              </DropdownMenuItem>
                            )}
                            {!o.invoiceId && o.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => generateInvoice(o)}>
                                <Receipt className="mr-2 h-4 w-4" /> Generate invoice
                              </DropdownMenuItem>
                            )}
                            {o.status === 'confirmed' && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setStatus(o, 'cancelled')}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel order
                              </DropdownMenuItem>
                            )}
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

      {/* View details */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.number}</DialogTitle>
            <DialogDescription>
              {viewing && customerName(viewing.customerId)} · {viewing?.status}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Start</p><p className="font-medium">{fmtDate(viewing.startDate)}</p></div>
                <div><p className="text-muted-foreground">End</p><p className="font-medium">{fmtDate(viewing.endDate)}</p></div>
                {viewing.returnedDate && (
                  <div><p className="text-muted-foreground">Returned</p><p className="font-medium">{fmtDate(viewing.returnedDate)}</p></div>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Item</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Days</th>
                      <th className="px-3 py-2 text-right font-medium">Rate</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewing.lineItems || []).map((li, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">{li.description}</td>
                        <td className="px-3 py-2 text-right">{li.qty}</td>
                        <td className="px-3 py-2 text-right">{li.days}</td>
                        <td className="px-3 py-2 text-right">{money(li.rate)}</td>
                        <td className="px-3 py-2 text-right">{money(li.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(viewing.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{money(viewing.discount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({(viewing.taxRate || 0) * 100}%)</span><span>{money(viewing.taxAmount)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total</span><span>{money(viewing.total)}</span></div>
              </div>
              {viewing.notes && <p className="text-sm text-muted-foreground">{viewing.notes}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return & charges */}
      <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record return — {returnTarget?.number}</DialogTitle>
            <DialogDescription>
              Marks the order returned and optionally adds late and damage charges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Late days</Label>
                <Input type="number" min={0} value={returnForm.lateDays}
                  onChange={(e) => setReturnForm({ ...returnForm, lateDays: Number(e.target.value) })}
                  className="bg-card border-border" />
              </div>
              <div>
                <Label className="mb-2 block">Late rate / day</Label>
                <Input type="number" min={0} step="0.01" value={returnForm.lateRatePerDay}
                  onChange={(e) => setReturnForm({ ...returnForm, lateRatePerDay: Number(e.target.value) })}
                  className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Damage amount</Label>
              <Input type="number" min={0} step="0.01" value={returnForm.damageAmount}
                onChange={(e) => setReturnForm({ ...returnForm, damageAmount: Number(e.target.value) })}
                className="bg-card border-border" />
            </div>
            <div>
              <Label className="mb-2 block">Damage note</Label>
              <Textarea value={returnForm.damageNote}
                onChange={(e) => setReturnForm({ ...returnForm, damageNote: e.target.value })}
                placeholder="Describe the damage (optional)"
                className="bg-card border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnTarget(null)}>Cancel</Button>
            <Button onClick={submitReturn} disabled={returnSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {returnSaving ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Record return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
