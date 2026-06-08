import axios from 'axios';
import type {
  User as _User,
  Organisation as _Organisation,
  Subscription as _Subscription,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- Token helpers (client-only) ---------------------------------
export const getToken = (): string | null => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
export const setToken = (token: string) => { if (typeof window !== 'undefined') localStorage.setItem('accessToken', token); };
export const clearToken = () => { if (typeof window !== 'undefined') { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } };

// ---- Auth API ------------------------------------------------------
export const authApi = {
  me: async () => (await api.get('/auth/me')).data,
  login: async (email: string, password: string) => (await api.post('/auth/login', { email, password })).data,
  register: async (payload: Record<string, unknown>) => (await api.post('/auth/register', payload)).data,
  subscribe: async (planId: string) => (await api.post('/auth/subscribe', { planId })).data,
};

// ---- Admin API (superadmin) ---------------------------------------
export const adminApi = {
  stats: async () => (await api.get('/superadmin/dashboard')).data,
  organizations: async () => (await api.get('/superadmin/organisations')).data,
  createOrg: async (body: Record<string, any>) => (await api.post('/superadmin/organisations', body)).data,
  updateOrg: async (id: string, patch: Record<string, any>) => (await api.patch(`/superadmin/organisations/${id}/status`, patch)).data,
  deleteOrg: async (id: string) => (await api.delete(`/superadmin/organisations/${id}`)).data,
  plans: async () => (await api.get('/superadmin/plans')).data,
  subscriptions: async () => (await api.get('/superadmin/subscriptions')).data,
  setSubscription: async (orgId: string, body: Record<string, any>) => (await api.put(`/superadmin/subscriptions/${orgId}`, body)).data,
  cancelSubscription: async (orgId: string) => (await api.patch(`/superadmin/subscriptions/${orgId}/cancel`)).data,
};

// ---- Generic resource helper -------------------------------------
export function resource<T = any>(name: string) {
  const base = `/${name}`;
  return {
    list: async (): Promise<T[]> => (await api.get(base)).data,
    get: async (id: string): Promise<T> => (await api.get(`${base}/${id}`)).data,
    create: async (body: any): Promise<T> => (await api.post(base, body)).data,
    update: async (id: string, patch: any): Promise<T> => (await api.put(`${base}/${id}`, patch)).data,
    delete: async (id: string) => (await api.delete(`${base}/${id}`)).data,
  };
}

// ---- Orders API (special actions) ---------------------------------
export const ordersApi = {
  list: async () => (await api.get('/orders')).data,
  get: async (id: string) => (await api.get(`/orders/${id}`)).data,
  create: async (body: any) => (await api.post('/orders', body)).data,
  update: async (id: string, patch: any) => (await api.put(`/orders/${id}`, patch)).data,
  delete: async (id: string) => (await api.delete(`/orders/${id}`)).data,
  setStatus: async (id: string, status: string) => (await api.post(`/orders/${id}/status`, { status })).data,
  generateInvoice: async (id: string) => (await api.post(`/orders/${id}/invoice`)).data,
  recordReturn: async (id: string, body: any) => (await api.post(`/orders/${id}/return`, body)).data,
};

// ---- Type exports used throughout the app (minimal shapes) -------
export type Plan = { id: string; name: string; price: number };
export type LineItem = { id?: string; description?: string; qty?: number; unitPrice?: number; total?: number };
export type Order = { id: string; number?: string; customerId?: string; startDate?: string; endDate?: string; total?: number; status?: string; invoiceId?: string; returnedDate?: string; lineItems?: LineItem[] };

export type AuthUser = _User;
export type Organization = _Organisation;
export type Subscription = _Subscription;

// `api` is already exported as default above; no duplicate export here.
