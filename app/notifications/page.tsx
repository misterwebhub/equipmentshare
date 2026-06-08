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
import { Bell, AlertTriangle, Clock, CheckCircle2, X, Archive } from 'lucide-react';

const notificationsApi = resource<any>('notifications');

const getIcon = (type: string) => {
  if (type === 'late-return') return <Clock className="h-5 w-5 text-orange-500" />;
  if (type === 'maintenance-due') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  if (type === 'damage-report') return <AlertTriangle className="h-5 w-5 text-red-500" />;
  if (type === 'equipment-available') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  return <Bell className="h-5 w-5" />;
};
const priorityColor = (p: string) => ({
  high: 'bg-red-500/10 border-red-500/30',
  medium: 'bg-yellow-500/10 border-yellow-500/30',
  low: 'bg-blue-500/10 border-blue-500/30',
}[p] || 'bg-gray-500/10 border-gray-500/30');

const fmtDateTime = (v: any) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

function NotifCard({ notif, onRead, onDelete }: { notif: any; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Card className={`border-l-4 p-4 transition-all ${notif.status === 'unread' ? priorityColor(notif.priority) : 'opacity-75'}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start gap-2">
            <h3 className="font-semibold text-foreground">{notif.title}</h3>
            {notif.status === 'unread' && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
          </div>
          <p className="mb-2 text-sm text-muted-foreground">{notif.message}</p>
          <div className="text-xs text-muted-foreground">{fmtDateTime(notif.createdAt)}</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge className={priorityColor(notif.priority).split(' ')[0]}>{notif.priority}</Badge>
          {notif.status === 'unread' && <Button variant="ghost" size="sm" onClick={() => onRead(notif.id)}>Mark Read</Button>}
          <Button variant="ghost" size="sm" onClick={() => onDelete(notif.id)}><X className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationsApi.list()
      .then(setNotifications)
      .catch((err) => toast({ title: 'Error loading notifications', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const markAsRead = async (id: string) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));
    try { await notificationsApi.update(id, { status: 'read' }); } catch { load(); }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((ns) => ns.filter((n) => n.id !== id));
    try { await notificationsApi.remove(id); } catch { load(); }
  };

  const archiveAll = async () => {
    const unread = notifications.filter((n) => n.status === 'unread');
    setNotifications((ns) => ns.map((n) => ({ ...n, status: 'read' })));
    try { await Promise.all(unread.map((n) => notificationsApi.update(n.id, { status: 'read' }))); }
    catch { load(); }
  };

  return (
    <AppShell title="Notifications">
      <div className="max-w-4xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Notification Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && <Button variant="outline" onClick={archiveAll}><Archive className="mr-2 h-4 w-4" />Mark All as Read</Button>}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="urgent">Urgent ({notifications.filter((n) => n.priority === 'high').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {notifications.length === 0 ? (
                <Card className="p-8 text-center"><Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" /><p className="text-muted-foreground">No notifications yet</p></Card>
              ) : notifications.map((n) => <NotifCard key={n.id} notif={n} onRead={markAsRead} onDelete={deleteNotification} />)}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3">
              {unreadCount === 0 ? (
                <Card className="p-8 text-center"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" /><p className="text-muted-foreground">All caught up!</p></Card>
              ) : notifications.filter((n) => n.status === 'unread').map((n) => <NotifCard key={n.id} notif={n} onRead={markAsRead} onDelete={deleteNotification} />)}
            </TabsContent>

            <TabsContent value="urgent" className="space-y-3">
              {notifications.filter((n) => n.priority === 'high').length === 0 ? (
                <Card className="p-8 text-center"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" /><p className="text-muted-foreground">No urgent notifications</p></Card>
              ) : notifications.filter((n) => n.priority === 'high').map((n) => <NotifCard key={n.id} notif={n} onRead={markAsRead} onDelete={deleteNotification} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
