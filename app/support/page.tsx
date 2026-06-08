'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, Clock, AlertCircle, CheckCircle2, Send, ChevronRight } from 'lucide-react';

const ticketsApi = resource<any>('tickets');

const priorityIcon = (p: string) => {
  if (p === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
  if (p === 'medium') return <Clock className="h-4 w-4 text-yellow-500" />;
  return <MessageSquare className="h-4 w-4 text-blue-500" />;
};
const priorityColor = (p: string) => ({
  high: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
}[p] || 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400');
const statusColor = (s: string) => ({
  open: 'bg-orange-500', 'in-progress': 'bg-blue-500', resolved: 'bg-green-500',
}[s] || 'bg-gray-500');
const fmtDate = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '—'; };
const fmtTime = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''; };

export default function SupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    ticketsApi.list()
      .then((t) => { setTickets(t); if (t.length) setSelectedId(t[0].id); })
      .catch((err) => toast({ title: 'Error loading tickets', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedId);
  const filtered = tickets.filter((t) => (priorityFilter === 'all' || t.priority === priorityFilter) && (statusFilter === 'all' || t.status === statusFilter));

  const sendMessage = () => {
    if (!messageText.trim() || !selectedTicket) return;
    const msg = { id: `msg-${Date.now()}`, sender: 'comp-2', content: messageText, timestamp: new Date().toISOString() };
    const updated = { ...selectedTicket, messages: [...(selectedTicket.messages || []), msg] };
    setTickets((ts) => ts.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setMessageText('');
    ticketsApi.update(selectedTicket.id, { messages: updated.messages }).catch(() => {});
  };

  return (
    <AppShell title="Customer Support">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
      ) : (
        <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Support Tickets</h2>
              <Button size="sm" disabled><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Filter by priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[calc(100vh-400px)] space-y-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <Card className="p-4 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" /><p className="text-sm text-muted-foreground">No tickets found</p></Card>
              ) : filtered.map((ticket) => (
                <Card key={ticket.id} className={`cursor-pointer p-4 transition-all hover:bg-secondary/40 ${selectedId === ticket.id ? 'border-primary bg-primary/10' : 'bg-card'}`} onClick={() => setSelectedId(ticket.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">{priorityIcon(ticket.priority)}<h3 className="truncate text-sm font-semibold text-foreground">{ticket.title}</h3></div>
                      <p className="truncate text-xs text-muted-foreground">ID: {ticket.id}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="flex h-full flex-col space-y-4">
                <Card className="border-border bg-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div><h1 className="mb-2 text-2xl font-bold text-foreground">{selectedTicket.title}</h1><p className="text-sm text-muted-foreground">Ticket ID: <span className="font-mono">{selectedTicket.id}</span></p></div>
                      <Badge className={statusColor(selectedTicket.status)}>{selectedTicket.status?.replace('-', ' ').toUpperCase()}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                      <div><p className="mb-1 text-xs text-muted-foreground">Priority</p><Badge className={priorityColor(selectedTicket.priority)}>{selectedTicket.priority?.toUpperCase()}</Badge></div>
                      <div><p className="mb-1 text-xs text-muted-foreground">Assigned To</p><p className="text-sm font-medium text-foreground">{selectedTicket.assignedTo || '—'}</p></div>
                      <div><p className="mb-1 text-xs text-muted-foreground">Created</p><p className="text-sm font-medium text-foreground">{fmtDate(selectedTicket.createdAt)}</p></div>
                    </div>
                  </div>
                </Card>

                <Card className="border-border bg-card p-6">
                  <h3 className="mb-2 font-semibold text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </Card>

                <Card className="flex flex-1 flex-col overflow-hidden border-border bg-card p-6">
                  <h3 className="mb-4 font-semibold text-foreground">Messages</h3>
                  <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
                    {(selectedTicket.messages || []).map((m: any) => (
                      <div key={m.id} className={`flex gap-3 ${m.sender === 'comp-2' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-lg p-3 ${m.sender === 'comp-2' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                          <p className="text-sm">{m.content}</p>
                          <p className="mt-1 text-xs opacity-70">{fmtTime(m.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Input placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" />
                    <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="flex h-full items-center justify-center p-8 text-center"><div><MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" /><p className="text-muted-foreground">Select a ticket to view details</p></div></Card>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
