'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';

function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [dashRes, revenueRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/revenue').catch(() => ({ data: { data: [] } })),
      ]);
      return {
        dashboard: dashRes.data.data,
        revenue: revenueRes.data.data || [],
      };
    },
  });
}

const COLORS = ['oklch(0.76 0.22 155)', 'oklch(0.68 0.26 250)', 'oklch(0.68 0.26 30)', 'oklch(0.65 0.28 30)'];

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'oklch(0.70 0.28 270) transparent transparent transparent' }} />
    </div>
  );

  const dash = data?.dashboard || {};
  const equipment = dash.equipment || {};
  const bookings = dash.bookings || {};

  const utilizationData = [
    { name: 'Available', value: Number(equipment.available) || 0 },
    { name: 'Rented Out', value: Number(equipment.rented) || 0 },
    { name: 'Maintenance', value: Number(equipment.maintenance) || 0 },
    { name: 'Damaged', value: Number(equipment.damaged) || 0 },
  ];

  const bookingData = [
    { name: 'Active', value: Number(bookings.active) || 0 },
    { name: 'Pending', value: Number(bookings.pending) || 0 },
    { name: 'Overdue', value: Number(bookings.overdue) || 0 },
  ];

  const revenueData = data?.revenue || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Business performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Units', value: equipment.total_units || 0, icon: Package, color: 'oklch(0.78 0.22 195)' },
          { label: 'Active Bookings', value: bookings.active || 0, icon: Calendar, color: 'oklch(0.68 0.26 250)' },
          { label: 'Month Revenue', value: `$${Number(dash.revenue?.month_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'oklch(0.76 0.22 155)' },
          { label: 'Utilization', value: equipment.total_units ? `${Math.round(((equipment.rented||0) / equipment.total_units) * 100)}%` : '0%', icon: TrendingUp, color: 'oklch(0.70 0.28 270)' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fleet Utilization Pie */}
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-sm">Fleet Utilization</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={utilizationData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {utilizationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Bar */}
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-sm">Booking Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="oklch(0.70 0.28 270)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue trend (if available) */}
        {revenueData.length > 0 && (
          <Card className="border-border/60 md:col-span-2">
            <CardHeader><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="oklch(0.76 0.22 155)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
