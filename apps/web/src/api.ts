import type { Contract, DashboardStats } from './types';

const BASE = '/api';

function getToken() {
  return localStorage.getItem('token') ?? '';
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Erro desconhecido');
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: any }>('POST', '/auth/login', { email, password }),
  me: () => req<any>('GET', '/auth/me'),

  dashboard: () => req<DashboardStats>('GET', '/contracts/dashboard'),

  contracts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return req<Contract[]>('GET', `/contracts${qs}`);
    },
    get: (id: string) => req<Contract>('GET', `/contracts/${id}`),
    create: (data: Partial<Contract>) => req<Contract>('POST', '/contracts', data),
    update: (id: string, data: Partial<Contract>) => req<Contract>('PUT', `/contracts/${id}`, data),
    delete: (id: string) => req<{ ok: boolean }>('DELETE', `/contracts/${id}`),
  },

  items: {
    create: (cid: string, data: any) => req<any>('POST', `/contracts/${cid}/items`, data),
    update: (cid: string, id: number, data: any) => req<any>('PUT', `/contracts/${cid}/items/${id}`, data),
    delete: (cid: string, id: number) => req<any>('DELETE', `/contracts/${cid}/items/${id}`),
  },

  empenhos: {
    create: (cid: string, data: any) => req<any>('POST', `/contracts/${cid}/empenhos`, data),
    update: (cid: string, id: number, data: any) => req<any>('PUT', `/contracts/${cid}/empenhos/${id}`, data),
    delete: (cid: string, id: number) => req<any>('DELETE', `/contracts/${cid}/empenhos/${id}`),
  },

  aditivos: {
    create: (cid: string, data: any) => req<any>('POST', `/contracts/${cid}/aditivos`, data),
    update: (cid: string, id: number, data: any) => req<any>('PUT', `/contracts/${cid}/aditivos/${id}`, data),
    delete: (cid: string, id: number) => req<any>('DELETE', `/contracts/${cid}/aditivos/${id}`),
  },

  lancamentos: {
    create: (cid: string, data: any) => req<any>('POST', `/contracts/${cid}/lancamentos`, data),
    update: (cid: string, id: number, data: any) => req<any>('PUT', `/contracts/${cid}/lancamentos/${id}`, data),
    delete: (cid: string, id: number) => req<any>('DELETE', `/contracts/${cid}/lancamentos/${id}`),
  },
};
