'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, User, Box, Calendar } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  user_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

const RESOURCE_COLORS: Record<string, string> = {
  equipment: 'oklch(0.78 0.22 195)',
  booking: 'oklch(0.68 0.26 250)',
  customer: 'oklch(0.76 0.22 155)',
  user: 'oklch(0.66 0.26 295)',
  maintenance: 'oklch(0.84 0.22 75)',
  penalty: 'oklch(0.68 0.26 30)',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  equipment: Box,
  booking: Calendar,
  customer: User,
  user: User,
};

export default function ActivityPage() {
  const [resource, setResource] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity', resource],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: '200' });
      if (resource) p.set('resource_type', resource);
      const { data } = await api.get(`/activity?${p}`);
      return data.data as ActivityLog[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const { data } = await api.get('/activity/stats');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">Audit log of all team actions</p>
      </div>

      {/* Top users & actions */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm">Most Active Users (30 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(stats.by_user || []).map((u: { name: string; actions: number }) => (
                  <div key={u.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.76 0.26 350))' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{u.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{u.actions} actions</Badge>
                  </div>
                ))}
                {!(stats.by_user || []).length && <p className="text-xs text-muted-foreground">No data yet</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm">Top Actions (30 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(stats.by_action || []).map((a: { action: string; count: number }) => (
                  <div key={a.action} className="flex items-center justify-between">
                    <span className="text-sm font-mono text-muted-foreground">{a.action}</span>
                    <Badge variant="outline" className="text-xs">{a.count}</Badge>
                  </div>
                ))}
                {!(stats.by_action || []).length && <p className="text-xs text-muted-foreground">No data yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'equipment', 'booking', 'customer', 'user', 'maintenance'].map((r) => (
          <Button key={r || 'all'} variant="outline" size="sm"
            className={resource === r ? 'border-primary text-primary' : ''}
            onClick={() => setResource(r)}>
            {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      {/* Log Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Resource</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">IP</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">No activity recorded yet</p>
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const color = RESOURCE_COLORS[log.resource_type || ''] || 'oklch(0.70 0.28 270)';
                  const Icon = ACTION_ICONS[log.resource_type || ''] || Activity;
                  return (
                    <tr key={log.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.76 0.26 350))' }}>
                            {(log.user_name || 'S')?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs">{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{log.action}</td>
                      <td className="p-3">
                        {log.resource_type && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
                              <Icon className="h-3 w-3" style={{ color }} />
                            </div>
                            <Badge className="text-[10px] capitalize" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                              {log.resource_type}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground font-mono">{log.ip_address || '—'}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
