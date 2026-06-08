'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';

const equipmentApi = resource<any>('equipment');
const maintenanceApi = resource<any>('maintenance');

const asTime = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.getTime() : null; };
const fmtDate = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '—'; };

const getHealthColor = (status: string) => ({
  healthy: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
  critical: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
}[status] || 'bg-gray-500/10 border-gray-500/30');
const getHealthIcon = (status: string) => {
  if (status === 'healthy') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  if (status === 'critical') return <AlertCircle className="h-5 w-5 text-red-500" />;
  return <Clock className="h-5 w-5" />;
};
const getHealthBadgeColor = (score: number) => (score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500');

export default function EquipmentHealthPage() {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    Promise.all([equipmentApi.list(), maintenanceApi.list().catch(() => [])])
      .then(([e, m]) => { setEquipment(e); setMaintenance(m); })
      .catch((err) => toast({ title: 'Error loading equipment health', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const equipmentHealth = equipment.map((eq) => {
    const lastT = asTime(eq.lastMaintenance);
    const daysSinceMaintenance = lastT ? Math.floor((now - lastT) / (1000 * 60 * 60 * 24)) : 999;
    let healthScore = 100;
    if (eq.condition === 'poor') healthScore = 30;
    else if (eq.condition === 'fair') healthScore = 60;
    else if (eq.condition === 'good') healthScore = 80;
    else if (eq.condition === 'excellent') healthScore = 95;
    if (daysSinceMaintenance > 180) healthScore -= 20;
    if (daysSinceMaintenance > 365) healthScore -= 30;
    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';
    const nextMaintenanceDate = lastT ? new Date(lastT + 180 * 24 * 60 * 60 * 1000) : null;
    const records = maintenance.filter((m) => m.equipmentId === eq.id);
    return {
      ...eq, healthScore, status, daysSinceMaintenance, nextMaintenanceDate,
      maintenanceCount: records.length,
      avgMaintenanceCost: records.length > 0 ? records.reduce((s, m) => s + (m.cost || 0), 0) / records.length : 0,
    };
  });

  const filteredEquipment = selectedStatus === 'all' ? equipmentHealth : equipmentHealth.filter((e) => e.status === selectedStatus);
  const total = equipmentHealth.length || 1;
  const healthyCount = equipmentHealth.filter((e) => e.status === 'healthy').length;
  const preventive = maintenance.filter((m) => m.type === 'preventive');
  const corrective = maintenance.filter((m) => m.type === 'corrective');
  const totalMaintenanceCost = maintenance.reduce((s, m) => s + (m.cost || 0), 0);

  const trendMap: Record<string, { month: string; count: number; cost: number }> = {};
  maintenance.forEach((m) => {
    const d = m.scheduledDate || m.completedDate || m.date;
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt.getTime())) return;
    const key = dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!trendMap[key]) trendMap[key] = { month: key, count: 0, cost: 0 };
    trendMap[key].count += 1;
    trendMap[key].cost += m.cost || 0;
  });
  const maintenanceTrend = Object.values(trendMap);

  return (
    <AppShell title="Equipment Health & Maintenance">
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border bg-card p-6"><p className="mb-2 text-sm text-muted-foreground">Healthy Equipment</p><p className="text-3xl font-bold text-green-600">{healthyCount}</p><p className="mt-2 text-xs text-muted-foreground">{Math.round((healthyCount / total) * 100)}% of fleet</p></Card>
              <Card className="border-border bg-card p-6"><p className="mb-2 text-sm text-muted-foreground">Needs Attention</p><p className="text-3xl font-bold text-yellow-600">{equipmentHealth.filter((e) => e.status === 'warning').length}</p><p className="mt-2 text-xs text-muted-foreground">Maintenance recommended</p></Card>
              <Card className="border-border bg-card p-6"><p className="mb-2 text-sm text-muted-foreground">Critical</p><p className="text-3xl font-bold text-red-600">{equipmentHealth.filter((e) => e.status === 'critical').length}</p><p className="mt-2 text-xs text-muted-foreground">Immediate action needed</p></Card>
              <Card className="border-border bg-card p-6"><p className="mb-2 text-sm text-muted-foreground">Maintenance Cost</p><p className="text-3xl font-bold text-foreground">${totalMaintenanceCost.toLocaleString()}</p><p className="mt-2 text-xs text-muted-foreground">{maintenance.length} records</p></Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-foreground">Maintenance Trend</h3>
                {maintenanceTrend.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No maintenance data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={maintenanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                      <XAxis dataKey="month" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" name="# of Records" />
                      <Line type="monotone" dataKey="cost" stroke="#8b5cf6" name="Cost ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-foreground">Maintenance Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-foreground">Preventive</p><Badge className="bg-green-500">{preventive.length}</Badge></div>
                    <div className="h-2 w-full rounded-full bg-secondary"><div className="h-2 rounded-full bg-green-500" style={{ width: `${maintenance.length ? (preventive.length / maintenance.length) * 100 : 0}%` }} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">Planned maintenance to prevent failures</p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-foreground">Corrective</p><Badge className="bg-yellow-500">{corrective.length}</Badge></div>
                    <div className="h-2 w-full rounded-full bg-secondary"><div className="h-2 rounded-full bg-yellow-500" style={{ width: `${maintenance.length ? (corrective.length / maintenance.length) * 100 : 0}%` }} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">Emergency repairs for failures</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="warning">Needs Attention</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredEquipment.length === 0 ? (
                  <Card className="p-8 text-center"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" /><p className="text-muted-foreground">No equipment in this category.</p></Card>
                ) : filteredEquipment.map((eq) => (
                  <Card key={eq.id} className={`border-l-4 p-6 ${getHealthColor(eq.status)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          {getHealthIcon(eq.status)}
                          <h3 className="text-lg font-semibold text-foreground">{eq.name}</h3>
                          <Badge className={getHealthBadgeColor(eq.healthScore)}>{eq.healthScore}%</Badge>
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">Category: {eq.category} • Condition: {eq.condition}</p>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div><p className="mb-1 text-xs text-muted-foreground">Last Maintenance</p><p className="text-sm font-medium text-foreground">{eq.daysSinceMaintenance >= 999 ? '—' : `${eq.daysSinceMaintenance} days ago`}</p></div>
                          <div><p className="mb-1 text-xs text-muted-foreground">Next Due</p><p className="text-sm font-medium text-foreground">{eq.nextMaintenanceDate ? fmtDate(eq.nextMaintenanceDate) : '—'}</p></div>
                          <div><p className="mb-1 text-xs text-muted-foreground">Maintenance Records</p><p className="text-sm font-medium text-foreground">{eq.maintenanceCount} records</p></div>
                          <div><p className="mb-1 text-xs text-muted-foreground">Avg. Cost</p><p className="text-sm font-medium text-foreground">${eq.avgMaintenanceCost.toFixed(0)}</p></div>
                        </div>
                        {eq.status === 'warning' && <div className="mt-3 rounded bg-yellow-500/20 p-2 text-sm text-yellow-700 dark:text-yellow-400">Preventive maintenance recommended to avoid downtime</div>}
                        {eq.status === 'critical' && <div className="mt-3 rounded bg-red-500/20 p-2 text-sm text-red-700 dark:text-red-400">Equipment requires immediate inspection and repair</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Calendar className="mr-2 h-4 w-4" />Schedule</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
