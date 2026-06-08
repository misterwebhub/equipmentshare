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

export interface BookingItem {
  equipment_id: string;
  equipment_unit_id?: string;
  description?: string;
  pricing_type: string; // fixed | daily | weekly | monthly | hourly
  unit_rate: number;
  quantity: number;
}

export interface CreateBookingPayload {
  customer_id: string;
  assigned_user_id?: string;
  start_date: string;
  end_date: string;
  security_deposit?: number;
  discount?: number;
  tax_rate?: number;
  estimated_cost?: number;
  notes?: string;
  status?: string;
  items: BookingItem[];
}

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
    mutationFn: (payload: CreateBookingPayload) => api.post('/bookings', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-units'] });
      toast.success('Booking created');
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error creating booking'),
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
