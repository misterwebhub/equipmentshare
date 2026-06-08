'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_FORM = {
  name: '',
  icon: 'Package',
  color: '#3b82f6',
  description: '',
  parent_id: '',
};

export type CategoryForm = typeof EMPTY_FORM;

export function useCategoriesModule() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: CategoryForm) =>
      api.post('/categories', { ...form, parent_id: form.parent_id || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: CategoryForm }) =>
      api.put(`/categories/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    EMPTY_FORM,
  };
}
