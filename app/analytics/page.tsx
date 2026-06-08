'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';

const rentalsApi = resource<any>('rentals');
const equipmentApi = resource<any>('equipment');
const penaltiesApi = resource<any>('penalties');

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const cost = (r: any) => r.actualCost || r.estimatedCost || 0;

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [rentals, setRentals] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([rentalsApi.list(), equipmentApi.list(), penaltiesApi.list().catch(() => [])])
      .then(([r, e, p]) => { setRentals(r); setEquipment(e); setPenalties(p); })
      .catch((err) => toast({ title: 'Error loading analytics', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = rentals.reduce((s, r) => s + cost(r), 0);
  const activeRentals = rentals.filter((r) => r.status === 'active').length;
  const avgRentalValue = rentals.length > 0 ? totalRevenue / rentals.length : 0;
  const pendingCharges = penalties.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  const statusDistribution = [
    { name: 'Available', value: equipment.filter((e) => e.status === 'available').length },
    { name: 'In Use', value: equipment.filter((e) => e.status === 'in-use').length },
    { name: 'Rented Out', value: equipment.filter((e) => e.status === 'rented-out').length },
    { name: 'Maintenance', value: equipment.filter((e) => e.status === 'maintenance').length },
    { name: 'Damaged', value: equipment.filter((e) => e.status === 'damaged').length },
  ].filter((d) => d.value > 0);

  const equipmentData = equipment.map((eq) => ({
    name: eq.name,
    rentals: rentals.filter((r) => (r.equipmentIds || []).includes(eq.id)).length,
    revenue: rentals.filter((r) => (r.equipmentIds || []).includes(eq.id)).reduce((s, r) => s + cost(r), 0),
  }));
  const topEquipment = [...equipmentData].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const utilizationPct = equipment.length > 0
    ? Math.round((equipment.filter((e) => e.status !== 'available').length / equipment.length) * 100) : 0;

  return (
    <AppShell title="Analytics & Insights">
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border bg-card p-6">
                <p className="mb-2 text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                <p className="mt-2 text-xs text-green-500"><TrendingUp className="mr-1 inline h-3 w-3" />All rentals</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div><p className="mb-2 text-sm text-muted-foreground">Active Rentals</p><p className="text-3xl font-bold text-foreground">{activeRentals}</p><p className="mt-2 text-xs text-muted-foreground">{rentals.length} total</p></div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div><p className="mb-2 text-sm text-muted-foreground">Avg Rental Value</p><p className="text-3xl font-bold text-foreground">${avgRentalValue.toFixed(0)}</p><p className="mt-2 text-xs text-muted-foreground">Per agreement</p></div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div><p className="mb-2 text-sm text-muted-foreground">Pending Charges</p><p className="text-3xl font-bold text-orange-500">${pendingCharges.toFixed(0)}</p><p className="mt-2 text-xs text-muted-foreground">{penalties.filter((p) => p.status === 'pending').length} penalties</p></div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><BarChart3 className="h-5 w-5" />Top Equipment by Rentals</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topEquipment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="name" stroke="currentColor" angle={-30} height={70} />
                    <YAxis stroke="currentColor" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rentals" fill="#3b82f6" name="Rentals" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Package className="h-5 w-5" />Equipment Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                      {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="border-border bg-card p-6 lg:col-span-2">
                <h3 className="mb-4 font-semibold text-foreground">Top Equipment by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topEquipment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis type="number" stroke="currentColor" />
                    <YAxis dataKey="name" type="category" width={150} stroke="currentColor" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Key Insights</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">Most Rented Equipment</p>
                  <p className="text-lg font-bold text-foreground">{topEquipment[0]?.name || 'N/A'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{topEquipment[0]?.rentals || 0} rentals • ${(topEquipment[0]?.revenue || 0).toLocaleString()} revenue</p>
                </div>
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">Equipment Utilization</p>
                  <p className="text-lg font-bold text-foreground">{utilizationPct}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">{equipment.filter((e) => e.status !== 'available').length} of {equipment.length} in use</p>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <p className="mb-2 text-sm font-medium text-orange-700 dark:text-orange-400">Outstanding Issues</p>
                  <p className="text-lg font-bold text-foreground">{penalties.filter((p) => p.status === 'pending').length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Pending penalties totaling ${pendingCharges.toFixed(0)}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
