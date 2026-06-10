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

export function useUtilizationReport() {
  return useQuery({
    queryKey: ['reports-utilization'],
    queryFn: async () => {
      const { data } = await api.get('/reports/utilisation'); // API endpoint kept as-is
      return data.data as unknown[];
    },
  });
}

/** @deprecated use useUtilizationReport */
export const useUtilisationReport = useUtilizationReport;
