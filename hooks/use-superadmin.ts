'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/superadmin/dashboard');
      return data.data;
    },
  });
}

export function useOrganisations(search = '', status = '', page = 1) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['superadmin-orgs', { search, status, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      const { data } = await api.get(`/superadmin/organisations?${params}`);
      return data as { data: unknown[]; total: number };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/superadmin/organisations/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-orgs'] }); toast.success('Organisation updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    organisations: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    updateStatusMutation,
  };
}

export function usePlans() {
  return useQuery({
    queryKey: ['superadmin-plans'],
    queryFn: async () => {
      const { data } = await api.get('/superadmin/plans');
      return data.data as unknown[];
    },
  });
}

export function useSubscriptions() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['superadmin-subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/superadmin/subscriptions');
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      org_id: string; plan_id: string; billing_cycle: string;
      starts_at: string; ends_at?: string; amount: number; notes?: string; status: string;
    }) => api.post('/superadmin/subscriptions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['superadmin-orgs'] });
      toast.success('Subscription created');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; plan_id: string; status: string; billing_cycle: string; starts_at: string; ends_at?: string; amount: number; notes?: string }) =>
      api.put(`/superadmin/subscriptions/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-subscriptions'] }); toast.success('Subscription updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/superadmin/subscriptions/${id}/cancel`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-subscriptions'] }); toast.success('Subscription cancelled'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    subscriptions: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    cancelMutation,
  };
}
