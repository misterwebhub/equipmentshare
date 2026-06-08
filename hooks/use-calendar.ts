'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useCalendarEvents(from?: string, to?: string, equipmentId?: string) {
  return useQuery({
    queryKey: ['calendar-events', { from, to, equipmentId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (equipmentId) params.set('equipment_id', equipmentId);
      const { data } = await api.get(`/calendar/events?${params}`);
      return data.data as unknown[];
    },
  });
}

export function useBlockDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { equipment_id: string; start_date: string; end_date: string; reason?: string }) =>
      api.post('/calendar/block', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar-events'] }); toast.success('Dates blocked'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });
}
