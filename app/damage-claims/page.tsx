'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, ImageIcon } from 'lucide-react';

const reportsApi = resource<any>('condition-reports');
const penaltiesApi = resource<any>('penalties');
const equipmentApi = resource<any>('equipment');
const rentalsApi = resource<any>('rentals');

const damageColor = (l: string) => ({
  severe: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500',
  moderate: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500',
  minor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500',
}[l] || 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500');
const penaltyColor = (s: string) => ({
  paid: 'bg-green-500/10 border-green-500',
  pending: 'bg-red-500/10 border-red-500',
}[s] || 'bg-gray-500/10 border-gray-500');

const fmtDate = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '—'; };

export default function DamageClaimsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([reportsApi.list(), penaltiesApi.list().catch(() => []), equipmentApi.list(), rentalsApi.list()])
      .then(([rep, pen, eq, ren]) => { setReports(rep); setPenalties(pen); setEquipment(eq); setRentals(ren); })
      .catch((err) => toast({ title: 'Error loading claims', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const eqName = (id?: string) => equipment.find((e) => e.id === id)?.name;
  const totalPending = penalties.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const severeCount = reports.filter((r) => r.damageLevel === 'severe' || r.damageLevel === 'moderate').length;

  const markPaid = async (id: string) => {
    try { await penaltiesApi.update(id, { status: 'paid', paidDate: new Date().toISOString() }); toast({ title: 'Penalty marked paid' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <AppShell title="Damage Claims & Penalties">
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Pending Penalties</p><p className="text-3xl font-bold text-foreground">${totalPending.toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-red-500" /></div></Card>
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Damage Reports</p><p className="text-3xl font-bold text-foreground">{reports.length}</p></div><AlertTriangle className="h-8 w-8 text-yellow-500" /></div></Card>
              <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="mb-2 text-sm text-muted-foreground">Severe / Moderate</p><p className="text-3xl font-bold text-foreground">{severeCount}</p></div><AlertTriangle className="h-8 w-8 text-orange-500" /></div></Card>
            </div>

            <Tabs defaultValue="damage" className="space-y-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="damage">Damage Reports</TabsTrigger>
                <TabsTrigger value="penalties">Penalties</TabsTrigger>
              </TabsList>

              <TabsContent value="damage" className="space-y-4">
                {reports.length === 0 && <Card className="p-8 text-center text-muted-foreground">No damage reports.</Card>}
                {reports.map((report) => (
                  <Card key={report.id} className={`border-l-4 p-6 ${damageColor(report.damageLevel)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{eqName(report.equipmentId)}</h3>
                          <Badge className={damageColor(report.damageLevel)}>{report.damageLevel?.toUpperCase()}</Badge>
                        </div>
                        <p className="mb-2 text-sm text-muted-foreground">Reported on {fmtDate(report.reportedDate)}</p>
                        <p className="mb-3 text-sm text-foreground">{report.description}</p>
                        <div className="space-y-2">
                          {report.repairRequired && <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-orange-500" /><span>Repair Required</span></div>}
                          {report.photos?.length > 0 && <div className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" /><span>{report.photos.length} photo(s) attached</span></div>}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="penalties" className="space-y-4">
                {penalties.length === 0 && <Card className="p-8 text-center text-muted-foreground">No penalties.</Card>}
                {penalties.map((penalty) => {
                  const rental = rentals.find((r) => r.id === penalty.rentalId);
                  return (
                    <Card key={penalty.id} className={`border-l-4 p-6 ${penaltyColor(penalty.status)}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{penalty.type === 'late-return' ? 'Late Return Charge' : 'Damage Claim'}</h3>
                            <Badge variant={penalty.status === 'paid' ? 'default' : 'destructive'}>{penalty.status?.toUpperCase()}</Badge>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">Rental ID: {rental?.id || penalty.rentalId || '—'}</p>
                          <div className="space-y-2 text-sm">
                            <p className="text-foreground">{penalty.description}</p>
                            <div className="mt-3 flex items-center gap-4">
                              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" /><span className="text-lg font-semibold">${(penalty.amount || 0).toFixed(2)}</span></div>
                              {penalty.daysOverdue && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{penalty.daysOverdue} days overdue</span></div>}
                              {penalty.status === 'paid' && penalty.paidDate && <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /><span>Paid on {fmtDate(penalty.paidDate)}</span></div>}
                            </div>
                          </div>
                        </div>
                        {penalty.status === 'pending' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markPaid(penalty.id)}>Mark Paid</Button>}
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}
