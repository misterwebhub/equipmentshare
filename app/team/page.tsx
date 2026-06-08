'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Users, CheckCircle2, Clock, Send, User, Mail } from 'lucide-react';

const peopleApi = resource<any>('people');
const equipmentApi = resource<any>('equipment');

const fmtTime = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''; };

export default function TeamPage() {
  const { toast } = useToast();
  const [people, setPeople] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([peopleApi.list(), equipmentApi.list()])
      .then(([p, e]) => { setPeople(p); setEquipment(e); if (p.length) setSelectedId(p[0].id); })
      .catch((err) => toast({ title: 'Error loading team', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const selectedPerson = people.find((p) => p.id === selectedId);
  const activeTeamMembers = people.filter((p) => p.status === 'active');
  const assignedEquipmentForPerson = equipment.filter((e) => e.assignedPersonId === selectedPerson?.id);

  const sendMessage = () => {
    if (!messageText.trim()) return;
    setMessages((ms) => [...ms, { id: `msg-${Date.now()}`, sender: 'current-user', senderName: 'You', content: messageText, timestamp: new Date().toISOString() }]);
    setMessageText('');
  };

  return (
    <AppShell title="Team Collaboration">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
      ) : (
        <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Users className="h-5 w-5" />Team Members</h2>
            </div>
            <Card className="border-border bg-secondary/50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="font-semibold">{activeTeamMembers.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">{people.length}</span></div>
              </div>
            </Card>
            <div className="max-h-[calc(100vh-400px)] space-y-2 overflow-y-auto">
              {people.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">No team members.</Card>
              ) : people.map((person) => (
                <Card key={person.id} className={`cursor-pointer p-4 transition-all ${selectedId === person.id ? 'border-primary bg-primary/10' : 'hover:bg-secondary/40'}`} onClick={() => setSelectedId(person.id)}>
                  <div className="mb-2 flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20"><User className="h-5 w-5 text-primary" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{person.name}</h3>
                      <p className="truncate text-xs capitalize text-muted-foreground">{person.role}</p>
                    </div>
                    {person.status === 'active' && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />}
                  </div>
                  {(person.assignedEquipment || []).length > 0 && <div className="text-xs text-muted-foreground">{person.assignedEquipment.length} equipment assigned</div>}
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4 lg:col-span-2">
            {selectedPerson ? (
              <>
                <Card className="border-border bg-card p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><User className="h-8 w-8 text-primary" /></div>
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{selectedPerson.name}</h1>
                        <p className="capitalize text-muted-foreground">{selectedPerson.role}</p>
                        <Badge className={selectedPerson.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>{(selectedPerson.status || '').charAt(0).toUpperCase() + (selectedPerson.status || '').slice(1)}</Badge>
                      </div>
                    </div>
                  </div>
                  <Tabs defaultValue="info" className="space-y-4">
                    <TabsList className="bg-secondary">
                      <TabsTrigger value="info">Information</TabsTrigger>
                      <TabsTrigger value="equipment">Equipment</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info" className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Email</p>
                          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{selectedPerson.email}</p></div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-foreground">{selectedPerson.phone || '—'}</p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="equipment" className="space-y-3">
                      {assignedEquipmentForPerson.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No equipment assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedEquipmentForPerson.map((eq) => (
                            <div key={eq.id} className="flex items-center justify-between rounded bg-secondary/30 p-2">
                              <span className="text-sm font-medium text-foreground">{eq.name}</span>
                              <Badge className={eq.status === 'available' ? 'bg-green-500' : eq.status === 'in-use' ? 'bg-blue-500' : 'bg-gray-500'}>{eq.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="tasks" className="space-y-3">
                      <div className="space-y-2">
                        <div className="rounded border border-green-500/20 bg-green-500/10 p-3"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" /><div><p className="text-sm font-medium text-foreground">Equipment Inspection</p><p className="text-xs text-muted-foreground">Completed recently</p></div></div></div>
                        <div className="rounded border border-blue-500/20 bg-blue-500/10 p-3"><div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-blue-500" /><div><p className="text-sm font-medium text-foreground">Maintenance Setup</p><p className="text-xs text-muted-foreground">Due soon</p></div></div></div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>

                <Card className="flex min-h-0 flex-1 flex-col border-border bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><MessageCircle className="h-5 w-5" />Messages</h3>
                  <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
                    {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>}
                    {messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.sender === 'current-user' ? 'justify-end' : 'justify-start'}`}>
                        {message.sender !== 'current-user' && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20"><User className="h-4 w-4" /></div>}
                        <div className={`max-w-sm rounded-lg p-3 ${message.sender === 'current-user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="mt-1 text-xs opacity-70">{message.senderName} • {fmtTime(message.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Input placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" />
                    <Button onClick={sendMessage} disabled={!messageText.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="flex h-full items-center justify-center p-8 text-center"><div><Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" /><p className="text-muted-foreground">Select a team member</p></div></Card>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
