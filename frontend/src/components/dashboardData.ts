import type { Invoice } from '../types';

const validatedStatuses = new Set([
  'VALIDATED',
  'APPROVED',
  'INTEGRATING',
  'INTEGRATED',
  'INTEGRATION_FAILED',
]);
export function dashboardMetrics(invoices: Invoice[]) {
  return {
    total: invoices.length,
    review: invoices.filter((invoice) => invoice.status === 'REVIEW_REQUIRED').length,
    validated: invoices.filter((invoice) => validatedStatuses.has(invoice.status)).length,
    integrated: invoices.filter((invoice) => invoice.status === 'INTEGRATED').length,
  };
}

export function documentTypes(invoices: Invoice[]) {
  const counts = new Map<string, number>();
  for (const invoice of invoices) {
    const extension = invoice.filename.match(/\.([a-z0-9]+)$/i)?.[1].toUpperCase() || 'Unknown';
    counts.set(extension, (counts.get(extension) || 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function processingTrend(
  invoices: Pick<Invoice, 'created_at' | 'status'>[],
  days: number,
  now = new Date(),
) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = 86_400_000;
  const start = today - (days - 1) * dayMs;
  const bucketSize = Math.ceil(days / 30);
  const buckets = Array.from({ length: Math.ceil(days / bucketSize) }, (_, index) => ({
    date: new Date(start + index * bucketSize * dayMs).toISOString().slice(0, 10),
    uploaded: 0,
    validated: 0,
  }));
  function add(date: string, field: 'uploaded' | 'validated') {
    const timestamp = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp > today) return;
    buckets[Math.floor((timestamp - start) / dayMs / bucketSize)][field]++;
  }
  for (const invoice of invoices) {
    add(invoice.created_at, 'uploaded');
    // List responses omit audit events: show current validation status by upload date.
    if (validatedStatuses.has(invoice.status)) add(invoice.created_at, 'validated');
  }
  return { buckets, bucketSize };
}

export function invoiceStatusDistribution(invoices: Invoice[]) {
  const statuses = [
    'INTEGRATED',
    'VALIDATED',
    'APPROVED',
    'REVIEW_REQUIRED',
    'INTEGRATION_FAILED',
    'UPLOADED',
    'EXTRACTED',
    'EXTRACTING',
    'INTEGRATING',
  ] as const;
  return statuses
    .map((status) => ({
      status,
      count: invoices.filter((invoice) => invoice.status === status).length,
    }))
    .filter((entry) => entry.count > 0);
}
