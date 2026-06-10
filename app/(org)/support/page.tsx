'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LifeBuoy, Plus, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_by_name?: string;
  assigned_to_name?: string;
  created_at: string;
  comments?: Comment[];
}

interface Comment {
  id: string;
  message: string;
  author_name?: string;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'oklch(0.70 0.28 270)',
  medium: 'oklch(0.80 0.22 90)',
  high: 'oklch(0.68 0.26 30)',
  urgent: 'oklch(0.65 0.30 20)',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'oklch(0.68 0.26 30)',
  in_progress: 'oklch(0.80 0.22 90)',
  resolved: 'oklch(0.76 0.22 155)',
  closed: 'oklch(0.55 0.04 255)',
};

export default function SupportPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data } = await api.get('/support-tickets');
      return data.data as Ticket[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/support-tickets', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket created');
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'other', priority: 'medium' });
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/support-tickets/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Status updated');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post(`/support-tickets/${id}/comments`, { message }),
    onSuccess: async (_, vars) => {
      const { data } = await api.get(`/support-tickets/${vars.id}`);
      setViewTicket(data.data);
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: () => toast.error('Failed to post comment'),
  });

  async function openTicket(t: Ticket) {
    const { data } = await api.get(`/support-tickets/${t.id}`);
    setViewTicket(data.data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and resolve issues</p>
        </div>
        <Button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }} className="text-white gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created By</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">No support tickets yet</p>
                    </td>
                  </tr>
                ) : tickets.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3">
                      <button className="font-medium text-left hover:underline" onClick={() => openTicket(t)}>{t.title}</button>
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{t.category}</td>
                    <td className="p-3">
                      <Badge className="text-xs capitalize" style={{ background: `${PRIORITY_COLORS[t.priority]}20`, color: PRIORITY_COLORS[t.priority], border: `1px solid ${PRIORITY_COLORS[t.priority]}40` }}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className="text-xs capitalize" style={{ background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status], border: `1px solid ${STATUS_COLORS[t.status]}40` }}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.created_by_name || '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openTicket(t)}>
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                        {t.status === 'open' && (
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => updateMutation.mutate({ id: t.id, status: 'in_progress' })}>
                            Start
                          </Button>
                        )}
                        {t.status === 'in_progress' && (
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => updateMutation.mutate({ id: t.id, status: 'resolved' })}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['equipment','booking','billing','technical','other'].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low','medium','high','urgent'].map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail…" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}
                onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Comment Dialog */}
      <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-6">{viewTicket?.title}</DialogTitle>
          </DialogHeader>
          {viewTicket && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className="capitalize" style={{ background: `${PRIORITY_COLORS[viewTicket.priority]}20`, color: PRIORITY_COLORS[viewTicket.priority], border: `1px solid ${PRIORITY_COLORS[viewTicket.priority]}40` }}>
                  {viewTicket.priority}
                </Badge>
                <Badge className="capitalize" style={{ background: `${STATUS_COLORS[viewTicket.status]}20`, color: STATUS_COLORS[viewTicket.status], border: `1px solid ${STATUS_COLORS[viewTicket.status]}40` }}>
                  {viewTicket.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="capitalize">{viewTicket.category}</Badge>
              </div>
              {viewTicket.description && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{viewTicket.description}</p>
              )}

              {/* Comments */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Comments</p>
                <div className="space-y-2">
                  {(viewTicket.comments || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                  ) : (viewTicket.comments || []).map((c) => (
                    <div key={c.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{c.author_name || 'System'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{c.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment */}
              {viewTicket.status !== 'closed' && (
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <Input value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment…" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && commentText && commentMutation.mutate({ id: viewTicket.id, message: commentText })} />
                  <Button size="icon" disabled={!commentText || commentMutation.isPending}
                    onClick={() => commentMutation.mutate({ id: viewTicket.id, message: commentText })}
                    style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
