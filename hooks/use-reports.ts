'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data.data;
    },
    refetchInterval: 60_000,
  });
}

export function useRevenueReport(months = 6) {
  return useQuery({
    queryKey: ['reports-revenue', months],
    queryFn: async () => {
      const { data } = await api.get(`/reports/revenue?months=${months}`);
      return data.data;
    },
  });
}

export function useUtilisationReport() {
  return useQuery({
    queryKey: ['reports-utilisation'],
    queryFn: async () => {
      const { data } = await api.get('/reports/utilisation');
      return data.data as unknown[];
    },
  });
}
