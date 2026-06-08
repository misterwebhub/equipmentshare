'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useOrgProfile() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const { data } = await api.get('/settings/profile');
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      name: string; category?: string; phone?: string;
      address?: string; tax_number?: string; currency?: string;
    }) => api.put('/settings/profile', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-profile'] }); toast.success('Profile updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return { profile: query.data, isLoading: query.isLoading, updateMutation };
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      api.put('/settings/password', payload),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });
}

export function useBilling() {
  return useQuery({
    queryKey: ['settings-billing'],
    queryFn: async () => {
      const { data } = await api.get('/settings/billing');
      return data.data;
    },
  });
}
