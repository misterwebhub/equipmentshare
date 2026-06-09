'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface BookingFilters {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
}

const EMPTY_FORM = {
  customer_id: '',
  equipment_id: '',
  equipment_unit_id: '',
  assigned_user_id: '',
  start_date: '',
  end_date: '',
  pricing_type: 'fixed',
  fixed_rate: '',
  hourly_rate: '',
  hours_used: '',
  estimated_cost: '',
  security_deposit: '',
  notes: '',
  status: 'pending',
};

export type BookingForm = CreateBookingPayload;

export function useBookings(filters: BookingFilters = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      const { data } = await api.get(`/bookings?${params}`);
      return data.data as unknown[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: BookingForm) =>
      api.post('/bookings', {
        ...form,
        fixed_rate: form.fixed_rate ? Number(form.fixed_rate) : 0,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        hours_used: form.hours_used ? Number(form.hours_used) : null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : 0,
        security_deposit: form.security_deposit ? Number(form.security_deposit) : 0,
        assigned_user_id: form.assigned_user_id || null,
        equipment_unit_id: (form as BookingForm & { equipment_unit_id?: string }).equipment_unit_id || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error creating booking'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: BookingForm }) =>
      api.put(`/bookings/${id}`, {
        ...form,
        fixed_rate: form.fixed_rate ? Number(form.fixed_rate) : 0,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        hours_used: form.hours_used ? Number(form.hours_used) : null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : 0,
        security_deposit: form.security_deposit ? Number(form.security_deposit) : 0,
        assigned_user_id: form.assigned_user_id || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking updated'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error updating booking'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, actual_cost }: { id: string; status: string; actual_cost?: number }) =>
      api.patch(`/bookings/${id}/status`, { status, actual_cost }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-units'] });
      qc.invalidateQueries({ queryKey: ['fleet-view'] });
      toast.success('Status updated');
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error'),
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createMutation,
    updateStatusMutation,
    EMPTY_FORM: {} as CreateBookingPayload,
  };
}

export function useBookingById(id: string | null) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${id}`);
      return data.data as Record<string, unknown>;
    },
    enabled: !!id,
  });
}
