'use client';
import { useDashboardStats } from '@/hooks/use-reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CalendarDays, DollarSign, AlertTriangle, Wrench, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const STAT_CARDS = [
  { key: (s: Record<string,unknown>) => s?.equipment  ? (s.equipment as Record<string,unknown>).total_units  : 0, label: 'Total Units',       icon: Package,       grad: 'stat-violet', glow: 'glow-violet' },
  { key: (s: Record<string,unknown>) => s?.equipment  ? (s.equipment as Record<string,unknown>).available    : 0, label: 'Available Units',   icon: TrendingUp,    grad: 'stat-cyan',   glow: 'glow-cyan'   },
  { key: (s: Record<string,unknown>) => s?.equipment  ? (s.equipment as Record<string,unknown>).rented       : 0, label: 'Rented Out',        icon: CalendarDays,  grad: 'stat-green',  glow: 'glow-green'  },
  { key: (s: Record<string,unknown>) => `$${((s?.revenue as Record<string,unknown>)?.month_revenue ?? 0).toLocaleString()}`, label: 'Month Revenue', icon: DollarSign, grad: 'stat-amber', glow: 'glow-amber' },
  { key: (s: Record<string,unknown>) => s?.equipment  ? (s.equipment as Record<string,unknown>).maintenance  : 0, label: 'In Maintenance',    icon: Wrench,        grad: 'stat-rose',   glow: 'glow-rose'   },
  { key: (s: Record<string,unknown>) => s?.maintenance_alerts ?? 0,                                               label: 'Maint. Alerts',     icon: AlertTriangle, grad: 'stat-pink',   glow: 'glow-pink'   },
];

const BOOKING_STATUS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-600 border-green-300  dark:text-green-400 dark:border-green-500/40',
  pending:   'bg-amber-500/15 text-amber-600 border-amber-300  dark:text-amber-400 dark:border-amber-500/40',
  completed: 'bg-blue-500/15  text-blue-600  border-blue-300   dark:text-blue-400  dark:border-blue-500/40',
  overdue:   'bg-red-500/15   text-red-600   border-red-300    dark:text-red-400   dark:border-red-500/40',
  cancelled: 'bg-gray-500/15  text-gray-600  border-gray-300   dark:text-gray-400  dark:border-gray-500/40',
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const s = stats as Record<string, unknown>;

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold shimmer-rainbow">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, grad, glow }) => (
          <div key={label} className={`relative rounded-2xl p-4 text-white overflow-hidden ${grad} ${glow} transition-transform hover:-translate-y-1`}>
            {/* decorative circle */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-6 h-16 w-16 rounded-full bg-white/8" />
            <Icon className="h-5 w-5 opacity-90 mb-2 relative z-10" />
            <p className="text-2xl font-bold relative z-10">{String(key(s ?? {}))}</p>
            <p className="text-xs text-white/75 mt-0.5 relative z-10 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <Card className="border-border/60 hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 pulse-glow" style={{ color: 'oklch(0.62 0.20 155)' }} />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!(s?.recent_bookings as unknown[])?.length ? (
              <p className="text-muted-foreground text-sm">No recent bookings</p>
            ) : (
              <div className="space-y-3">
                {(s.recent_bookings as Record<string, unknown>[]).slice(0, 6).map((b) => (
                  <div key={b.id as string} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                    <div>
                      <p className="font-medium">{b.equipment_name as string}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {b.customer_name as string} · {format(new Date(b.start_date as string), 'MMM d')} – {format(new Date(b.end_date as string), 'MMM d')}
                      </p>
                    </div>
                    <Badge className={`text-xs capitalize border ${BOOKING_STATUS[b.status as string] || ''}`} variant="outline">
                      {b.status as string}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming maintenance */}
        <Card className="border-border/60 hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 pulse-glow" style={{ color: 'oklch(0.75 0.20 75)' }} />
              Upcoming Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!(s?.upcoming_maintenance as unknown[])?.length ? (
              <p className="text-muted-foreground text-sm">No upcoming maintenance</p>
            ) : (
              <div className="space-y-3">
                {(s.upcoming_maintenance as Record<string, unknown>[]).slice(0, 6).map((m) => (
                  <div key={m.id as string} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                    <div>
                      <p className="font-medium">{m.equipment_name as string}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {(m.description as string) || (m.type as string)} · {format(new Date(m.scheduled_date as string), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize border-amber-300 text-amber-600 dark:text-amber-400 dark:border-amber-500/40">
                      {m.status as string}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
