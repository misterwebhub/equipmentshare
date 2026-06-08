'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useEquipmentUnits(equipmentId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['equipment-units', equipmentId],
    queryFn: async () => {
      const { data } = await api.get(`/equipment/${equipmentId}/units`);
      return data.data as unknown[];
    },
    enabled: !!equipmentId,
  });

  const createUnitsMutation = useMutation({
    mutationFn: ({ equipmentId, skus }: { equipmentId: string; skus: { sku_code: string; notes: string }[] }) =>
      api.post(`/equipment/${equipmentId}/units`, { skus }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment-units', vars.equipmentId] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Units added');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error adding units'),
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: { sku_code: string; status: string; notes: string } }) =>
      api.put(`/equipment-units/${unitId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment-units', equipmentId] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Unit updated');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error updating unit'),
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: string) => api.delete(`/equipment-units/${unitId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment-units', equipmentId] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Unit deleted');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error deleting unit'),
  });

  return {
    units: query.data ?? [],
    isLoading: query.isLoading,
    createUnitsMutation,
    updateUnitMutation,
    deleteUnitMutation,
  };
}

// Hook to get available units for a date range (used in bookings)
export function useAvailableUnits(equipmentId: string | null, startDate: string, endDate: string, excludeBookingId?: string) {
  return useQuery({
    queryKey: ['available-units', equipmentId, startDate, endDate, excludeBookingId],
    queryFn: async () => {
      const params = new URLSearchParams({ equipment_id: equipmentId!, start_date: startDate, end_date: endDate });
      if (excludeBookingId) params.set('exclude_booking_id', excludeBookingId);
      const { data } = await api.get(`/equipment-units/available?${params}`);
      return data.data as { id: string; sku_code: string; status: string; notes: string }[];
    },
    enabled: !!equipmentId && !!startDate && !!endDate,
  });
}

// Hook for fleet view
export function useFleetView() {
  return useQuery({
    queryKey: ['fleet-view'],
    queryFn: async () => {
      const { data } = await api.get('/equipment-units/fleet');
      return { units: data.data as unknown[], summary: data.summary };
    },
  });
}
