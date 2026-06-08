'use client';
import { useDashboardStats, useRevenueReport, useUtilisationReport } from '@/hooks/use-reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const { data: stats } = useDashboardStats();
  const { data: revenue } = useRevenueReport(6);
  const { data: utilisation } = useUtilisationReport();

  const monthlyData = (revenue as Record<string, unknown> | undefined)?.monthly ?? [];
  const byEquipment = (revenue as Record<string, unknown> | undefined)?.by_equipment ?? [];
  const byCustomer = (revenue as Record<string, unknown> | undefined)?.by_customer ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Business performance analytics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Month Revenue</p></div><p className="text-2xl font-bold mt-1">${((stats?.revenue?.month_revenue as number) ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Active Bookings</p></div><p className="text-2xl font-bold mt-1">{(stats?.bookings?.active as number) ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Available Equipment</p></div><p className="text-2xl font-bold mt-1">{(stats?.equipment?.available as number) ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Overdue Bookings</p></div><p className="text-2xl font-bold mt-1">{(stats?.bookings?.overdue as number) ?? 0}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue (Last 6 Months)</CardTitle></CardHeader>
            <CardContent>
              {(monthlyData as unknown[]).length === 0 ? <p className="text-muted-foreground text-sm">No revenue data yet</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData as Record<string, unknown>[]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Equipment by Revenue</CardTitle></CardHeader>
              <CardContent>
                {(byEquipment as unknown[]).length === 0 ? <p className="text-muted-foreground text-sm">No data yet</p> : (
                  <div className="space-y-3">
                    {(byEquipment as Record<string, unknown>[]).slice(0, 8).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{e.name as string}</span>
                        <div className="text-right ml-2">
                          <p className="font-medium">${((e.revenue as number) || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{e.bookings as number} bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Utilisation Overview</CardTitle></CardHeader>
              <CardContent>
                {!(utilisation as unknown[])?.length ? <p className="text-muted-foreground text-sm">No data yet</p> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={(utilisation as Record<string, unknown>[]).slice(0, 6)} dataKey="total_days_booked" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {(utilisation as unknown[]).slice(0, 6).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Days Booked']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Customers by Revenue</CardTitle></CardHeader>
            <CardContent>
              {(byCustomer as unknown[]).length === 0 ? <p className="text-muted-foreground text-sm">No data yet</p> : (
                <div className="space-y-3">
                  {(byCustomer as Record<string, unknown>[]).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <span className="flex-1 font-medium">{c.name as string}</span>
                      <div className="text-right">
                        <p className="font-medium">${((c.revenue as number) || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{c.bookings as number} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
