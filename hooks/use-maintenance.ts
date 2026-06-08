'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_FORM = {
  equipment_id: '',
  type: 'preventive',
  frequency: 'monthly',
  scheduled_date: '',
  description: '',
  cost: '',
};

export type MaintenanceForm = typeof EMPTY_FORM;

export function useMaintenance(status = '') {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['maintenance', { status }],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get(`/maintenance${params}`);
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: MaintenanceForm) =>
      api.post('/maintenance', { ...form, cost: form.cost ? Number(form.cost) : 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Maintenance scheduled'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: MaintenanceForm & { status?: string } }) =>
      api.put(`/maintenance/${id}`, { ...form, cost: form.cost ? Number(form.cost) : 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Maintenance updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Deleted'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes, cost, next_due_date }: { id: string; notes: string; cost: number; next_due_date?: string }) =>
      api.patch(`/maintenance/${id}/complete`, { notes, cost, next_due_date }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Marked as complete'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    schedules: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    completeMutation,
    EMPTY_FORM,
  };
}
