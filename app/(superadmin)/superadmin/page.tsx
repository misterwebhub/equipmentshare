'use client';
import { useSuperAdminDashboard } from '@/hooks/use-superadmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color || ''}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useSuperAdminDashboard();

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>)}
      </div>
    </div>
  );

  const orgs = data?.organisations as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Real-time metrics across all organizations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Orgs" value={(orgs?.total as number) ?? 0} sub={`${(data?.new_orgs_30d as number) ?? 0} new in 30 days`} />
        <StatCard icon={TrendingUp} label="Active Orgs" value={(orgs?.active as number) ?? 0} color="text-green-600" />
        <StatCard icon={Clock} label="On Trial" value={(orgs?.trial as number) ?? 0} color="text-yellow-600" />
        <StatCard icon={DollarSign} label="Monthly MRR" value={`$${((data?.mrr as number) ?? 0).toLocaleString()}`} color="text-blue-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Organizations</CardTitle></CardHeader>
        <CardContent>
          {!(data?.recent_organisations as unknown[])?.length ? (
            <p className="text-muted-foreground text-sm">No organizations yet</p>
          ) : (
            <div className="space-y-3">
              {(data.recent_organisations as Record<string, unknown>[]).map((org) => (
                <div key={org.id as string} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{org.name as string}</p>
                    <p className="text-muted-foreground text-xs">{format(new Date(org.created_at as string), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{org.plan_name as string}</span>
                    <Badge variant={org.status === 'active' ? 'default' : org.status === 'trial' ? 'secondary' : 'destructive'} className="capitalize text-xs">
                      {org.status as string}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
