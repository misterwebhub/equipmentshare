'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_FORM = {
  booking_id: '',
  customer_id: '',
  type: 'other',
  amount: '',
  days_overdue: '0',
  description: '',
};

export type PenaltyForm = typeof EMPTY_FORM;

export function usePenalties(status = '') {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['penalties', { status }],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get(`/penalties${params}`);
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: PenaltyForm) =>
      api.post('/penalties', {
        ...form,
        amount: Number(form.amount),
        days_overdue: Number(form.days_overdue) || 0,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penalties'] }); toast.success('Penalty created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/penalties/${id}/waive`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penalties'] }); toast.success('Penalty waived'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/penalties/${id}/mark-paid`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penalties'] }); toast.success('Marked as paid'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    penalties: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    waiveMutation,
    markPaidMutation,
    EMPTY_FORM,
  };
}
