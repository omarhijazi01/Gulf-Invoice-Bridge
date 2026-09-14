import type { Invoice, InvoiceFields, IntegrationLog, Stats, System } from '../types';
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.error?.message ?? `Request failed (HTTP ${response.status})`);
  return data as T;
}
export const api = {
  invoices: () => request<Invoice[]>('/invoices'),
  invoice: (id: string) => request<Invoice>(`/invoices/${id}`),
  stats: () => request<Stats>('/dashboard/stats'),
  system: () => request<System>('/system'),
  logs: () => request<IntegrationLog[]>('/integration/logs'),
  sample: (scenario: string) =>
    request<Invoice>('/invoices/sample', { method: 'POST', body: JSON.stringify({ scenario }) }),
  upload: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<Invoice>('/invoices/upload', { method: 'POST', body });
  },
  action: (id: string, action: string, scenario = 'SUCCESS') =>
    request<Invoice>(`/invoices/${id}/${action}`, {
      method: 'POST',
      body: ['integrate', 'retry-integration'].includes(action)
        ? JSON.stringify({ scenario })
        : undefined,
    }),
  edit: (id: string, data: InvoiceFields & { version: number }) =>
    request<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  payload: (id: string) => request<Record<string, unknown>>(`/invoices/${id}/payload`),
};
