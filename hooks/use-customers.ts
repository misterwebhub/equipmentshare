'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_FORM = {
  name: '',
  type: 'small_business',
  email: '',
  phone: '',
  address: '',
  tax_number: '',
  notes: '',
};

export type CustomerForm = typeof EMPTY_FORM;

export function useCustomers(search = '', status = '') {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['customers', { search, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      const { data } = await api.get(`/customers?${params}`);
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: CustomerForm) => api.post('/customers', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: CustomerForm & { status?: string } }) =>
      api.put(`/customers/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deactivated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    EMPTY_FORM,
  };
}
