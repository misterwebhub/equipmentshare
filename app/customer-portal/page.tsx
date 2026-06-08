'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, FileText, MessageSquare, Download, CheckCircle2, Truck } from 'lucide-react';

const rentalsApi = resource<any>('rentals');
const equipmentApi = resource<any>('equipment');
const customersApi = resource<any>('customers');
const notificationsApi = resource<any>('notifications');

const asDate = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d : null; };
const fmtDate = (v: any) => asDate(v)?.toLocaleDateString() || '—';
const fmtTime = (v: any) => asDate(v)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
const cost = (r: any) => r.actualCost || r.estimatedCost || 0;

const statusColor = (s: string) => ({
  active: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
}[s] || 'bg-gray-500/10 border-gray-500/30');
const statusBadge = (s: string) => ({ active: 'bg-blue-500', completed: 'bg-green-500', pending: 'bg-yellow-500' }[s] || 'bg-gray-500');

export default function CustomerPortalPage() {
  const { toast } = useToast();
  const [rentals, setRentals] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState('all');

  useEffect(() => {
    Promise.all([rentalsApi.list(), equipmentApi.list(), customersApi.list(), notificationsApi.list().catch(() => [])])
      .then(([r, e, c, n]) => { setRentals(r); setEquipment(e); setCustomers(c); setNotifications(n); })
      .catch((err) => toast({ title: 'Error loading portal', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const customerRentals = rentals.filter((r) => customerId === 'all' || r.rentalCompanyId === customerId);
  const activeRentals = customerRentals.filter((r) => r.status === 'active');
  const completedRentals = customerRentals.filter((r) => r.status === 'completed');
  const now = Date.now();
  const upcomingRentals = customerRentals.filter((r) => r.status === 'pending' && (asDate(r.startDate)?.getTime() || 0) > now);
  const totalSpent = customerRentals.reduce((s, r) => s + cost(r), 0);
  const eqName = (id?: string) => equipment.find((e) => e.id === id)?.name || '—';

  const renderRental = (rental: any) => {
    const end = asDate(rental.endDate);
    const daysRemaining = end ? Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24)) : null;
    return (
      <Card key={rental.id} className={`border-l-4 p-6 ${statusColor(rental.status)}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{eqName((rental.equipmentIds || [])[0])}</h3>
              <Badge className={statusBadge(rental.status)}>{(rental.status || '').toUpperCase()}</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">${cost(rental).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div><p className="mb-1 text-xs text-muted-foreground">Start Date</p><p className="text-sm font-medium text-foreground">{fmtDate(rental.startDate)}</p></div>
            <div><p className="mb-1 text-xs text-muted-foreground">End Date</p><p className="text-sm font-medium text-foreground">{fmtDate(rental.endDate)}</p></div>
            {rental.status === 'active' && daysRemaining !== null && <div><p className="mb-1 text-xs text-muted-foreground">Days Left</p><p className="text-sm font-medium text-foreground">{daysRemaining} days</p></div>}
          </div>
          {rental.notes && <div className="rounded bg-secondary/30 p-3"><p className="text-sm text-foreground">{rental.notes}</p></div>}
          <div className="flex gap-2 pt-2">
            {rental.status === 'active' && (
              <>
                <Button variant="outline" size="sm" disabled><MessageSquare className="mr-2 h-4 w-4" />Message</Button>
                <Button variant="outline" size="sm" disabled><FileText className="mr-2 h-4 w-4" />Request Extension</Button>
              </>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Invoice</Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AppShell title="Customer Portal">
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <>
            <div className="max-w-xs">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Active Rentals</p><p className="text-3xl font-bold text-foreground">{activeRentals.length}</p></div><Truck className="h-8 w-8 text-blue-500" /></div></Card>
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Total Spent</p><p className="text-3xl font-bold text-foreground">${totalSpent.toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-green-500" /></div></Card>
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Upcoming</p><p className="text-3xl font-bold text-foreground">{upcomingRentals.length}</p></div><Calendar className="h-8 w-8 text-yellow-500" /></div></Card>
            </div>

            <Tabs defaultValue="rentals" className="space-y-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="rentals">My Rentals</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="rentals" className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Active Rentals</h2>
                  {activeRentals.length === 0 ? (
                    <Card className="p-8 text-center"><Truck className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" /><p className="text-muted-foreground">No active rentals</p></Card>
                  ) : <div className="space-y-3">{activeRentals.map(renderRental)}</div>}
                </div>
                {upcomingRentals.length > 0 && <div className="space-y-4"><h2 className="text-xl font-semibold text-foreground">Upcoming Rentals</h2><div className="space-y-3">{upcomingRentals.map(renderRental)}</div></div>}
                {completedRentals.length > 0 && <div className="space-y-4"><h2 className="text-xl font-semibold text-foreground">Rental History</h2><div className="space-y-3">{completedRentals.map(renderRental)}</div></div>}
              </TabsContent>

              <TabsContent value="messages" className="space-y-3">
                {notifications.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">No messages.</Card>
                ) : notifications.map((notif) => (
                  <Card key={notif.id} className="cursor-pointer p-4 transition-colors hover:bg-secondary/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="mb-1 font-semibold text-foreground">{notif.title}</h3>
                        <p className="mb-2 text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(notif.createdAt)} at {fmtTime(notif.createdAt)}</p>
                      </div>
                      <Badge className={notif.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}>{notif.priority}</Badge>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <Card className="border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Account Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><span className="text-foreground">Total Rentals</span><span className="font-semibold">{customerRentals.length}</span></div>
                    <div className="flex items-center justify-between"><span className="text-foreground">Total Spent</span><span className="font-semibold">${totalSpent.toLocaleString()}</span></div>
                    <div className="flex items-center justify-between"><span className="text-foreground">Average Per Rental</span><span className="font-semibold">${customerRentals.length ? Math.round(totalSpent / customerRentals.length).toLocaleString() : 0}</span></div>
                  </div>
                </Card>
                <Card className="border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Invoices</h3>
                  {customerRentals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerRentals.slice(0, 5).map((rental) => (
                        <div key={rental.id} className="flex cursor-pointer items-center justify-between rounded p-3 transition-colors hover:bg-secondary/30">
                          <div><p className="text-sm font-medium text-foreground">Invoice #{rental.id.slice(-4)}</p><p className="text-xs text-muted-foreground">{fmtDate(rental.startDate)}</p></div>
                          <div className="flex items-center gap-3"><span className="font-semibold">${cost(rental).toLocaleString()}</span><Button variant="ghost" size="sm" onClick={() => window.print()}><Download className="h-4 w-4" /></Button></div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}
