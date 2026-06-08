'use client';
import { useState } from 'react';
import { useCalendarEvents, useBlockDates } from '@/hooks/use-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

const EVENT_COLORS: Record<string, string> = {
  rental: 'bg-blue-500/80 text-white',
  maintenance: 'bg-yellow-500/80 text-white',
  block: 'bg-gray-500/80 text-white',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ equipment_id: '', start_date: '', end_date: '', reason: '' });

  const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
  const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');

  const { data: events = [] } = useCalendarEvents(start, end);
  const blockMutation = useBlockDates();

  const handleBlock = () => {
    blockMutation.mutate(
      { equipment_id: form.equipment_id, start_date: form.start_date, end_date: form.end_date, reason: form.reason },
      { onSuccess: () => setOpen(false) }
    );
  };

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) });

  const eventsForDay = (day: Date) => (events as Record<string, unknown>[]).filter(e => {
    const s = parseISO(e.start_date as string);
    const en = parseISO(e.end_date as string);
    return day >= s && day <= en;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Bookings & maintenance schedule</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Block Dates</Button>
      </div>

      <div className="flex gap-4 text-sm">
        {Object.entries(EVENT_COLORS).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${cls.split(' ')[0]}`} />
            <span className="capitalize text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-muted/40 text-center text-xs font-medium py-2 text-muted-foreground">{d}</div>
            ))}
            {days.map((day) => {
              const dayEvents = eventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`bg-background min-h-[80px] p-1 ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  <p className={`text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={`${e.id as string}-${idx}`} className={`text-xs px-1 py-0.5 rounded truncate ${EVENT_COLORS[e.event_type as string] || 'bg-gray-500/80 text-white'}`}>
                        {(e.equipment_name as string) || (e.title as string) || 'Event'}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">This Month&apos;s Events</CardTitle></CardHeader>
        <CardContent>
          {(events as unknown[]).length === 0 ? (
            <div className="text-center py-6"><CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground text-sm">No events this month</p></div>
          ) : (
            <div className="space-y-2">
              {(events as Record<string, unknown>[]).slice(0, 10).map(e => (
                <div key={e.id as string} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="capitalize text-xs">{e.event_type as string}</Badge>
                  <span className="font-medium flex-1 truncate">{(e.customer_name as string) || (e.title as string) || (e.equipment_name as string)}</span>
                  <span className="text-muted-foreground text-xs">
                    {format(parseISO(e.start_date as string), 'MMM d')} – {format(parseISO(e.end_date as string), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block Equipment Dates</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Equipment ID</Label><Input value={form.equipment_id} onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))} placeholder="Equipment ID to block" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Optional reason" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleBlock} disabled={!form.start_date || !form.end_date || blockMutation.isPending}>{blockMutation.isPending ? 'Blocking...' : 'Block'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
