'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: 'oklch(0.70 0.28 270)',
  warning: 'oklch(0.80 0.22 90)',
  error: 'oklch(0.65 0.30 20)',
  success: 'oklch(0.76 0.22 155)',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return { notifications: data.data as Notification[], unread: data.unread_count as number };
    },
  });

  const markRead = useMutation({
    mutationFn: (ids?: string[]) => api.patch('/notifications/read', { ids: ids || [] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">System alerts and updates</p>
          </div>
          {unread > 0 && (
            <Badge className="rounded-full" style={{ background: 'oklch(0.68 0.26 30)', color: 'white' }}>
              {unread} unread
            </Badge>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => markRead.mutate([])}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((n) => {
                const color = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                return (
                  <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors ${!n.is_read ? 'bg-muted/10' : ''}`}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20` }}>
                      <Bell className="h-4 w-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${!n.is_read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                        {!n.is_read && <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />}
                        <Badge variant="outline" className="text-[10px] capitalize ml-auto shrink-0">{n.type}</Badge>
                      </div>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead.mutate([n.id])}>
                          <CheckCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => remove.mutate(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
