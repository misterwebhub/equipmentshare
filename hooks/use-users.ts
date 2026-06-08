'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'operator',
};

export type UserInviteForm = typeof EMPTY_FORM;

export function useUsers(search = '', role = '', status = '') {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['users', { search, role, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role && role !== 'all') params.set('role', role);
      if (status && status !== 'all') params.set('status', status);
      const { data } = await api.get(`/users?${params}`);
      return data.data as unknown[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (form: UserInviteForm) => api.post('/users/invite', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User invited'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error inviting user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, role }: { id: string; name: string; role: string }) =>
      api.put(`/users/${id}`, { name, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    inviteMutation,
    updateMutation,
    deactivateMutation,
    EMPTY_FORM,
  };
}
