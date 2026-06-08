'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface EquipmentFilters {
  search: string;
  status: string;
  category_id: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  serial_number: '',
  category_id: '',
  status: 'available',
  condition: 'good',
  location: '',
  pricing_type: 'fixed',
  fixed_rate: '',
  hourly_rate: '',
  min_rental_days: '1',
  security_deposit: '',
};

export type EquipmentForm = typeof EMPTY_FORM & { skus?: { sku_code: string; notes: string }[] };

export function useEquipment(filters: Partial<EquipmentFilters> = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['equipment', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.category_id) params.set('category_id', filters.category_id);
      const { data } = await api.get(`/equipment?${params}`);
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: EquipmentForm) =>
      api.post('/equipment', {
        ...form,
        fixed_rate: form.fixed_rate ? Number(form.fixed_rate) : 0,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        min_rental_days: Number(form.min_rental_days) || 1,
        security_deposit: form.security_deposit ? Number(form.security_deposit) : 0,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipment saved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error saving equipment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: EquipmentForm }) =>
      api.put(`/equipment/${id}`, {
        ...form,
        fixed_rate: form.fixed_rate ? Number(form.fixed_rate) : 0,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        min_rental_days: Number(form.min_rental_days) || 1,
        security_deposit: form.security_deposit ? Number(form.security_deposit) : 0,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipment updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error updating equipment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/equipment/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Equipment deleted'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error deleting equipment'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/equipment/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Status updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    equipment: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createMutation,
    updateMutation,
    deleteMutation,
    updateStatusMutation,
    EMPTY_FORM,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data as unknown[];
    },
  });
}
