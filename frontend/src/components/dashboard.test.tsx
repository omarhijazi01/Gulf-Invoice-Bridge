import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { ReviewQueue } from '../pages/ReviewQueue';
import { InvoiceWorkspace } from '../pages/InvoiceDetails';
import { Layout } from './Layout';
import { api } from '../services/api';
import { dashboardMetrics, documentTypes, processingTrend } from './dashboardData';
import type { Invoice } from '../types';

vi.mock('../services/api', () => ({
  api: { invoices: vi.fn(), invoice: vi.fn(), action: vi.fn(), edit: vi.fn() },
  backendUrl: (path: string) => path,
}));
const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'inv-1',
  filename: 'invoice.pdf',
  invoice_number: 'INV-001',
  supplier_name: 'Gulf Supplies',
  supplier_tax_number: null,
  customer_name: null,
  customer_tax_number: null,
  currency: 'SAR',
  invoice_date: '2026-09-15',
  subtotal: '100',
  tax_amount: '15',
  total_amount: '115',
  items: [],
  status: 'INTEGRATED',
  is_demo: false,
  version: 1,
  created_at: '2026-09-15T12:00:00',
  updated_at: '2026-09-15T12:00:00',
  reviewed_at: null,
  approved_at: null,
  erp_reference: null,
  processing_ms: null,
  last_error: null,
  validation_results: [],
  evidence: [],
  events: [],
  integration_logs: [],
  ...overrides,
});

beforeEach(() => {
  vi.mocked(api.invoices).mockReset();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('truthful dashboard data', () => {
  it('includes downstream stages in validated totals without counting unvalidated documents', () => {
    const invoices = [
      invoice(),
      invoice({ status: 'INTEGRATION_FAILED' }),
      invoice({ status: 'REVIEW_REQUIRED' }),
      invoice({ status: 'UPLOADED' }),
    ];
    expect(dashboardMetrics(invoices)).toEqual({
      total: 4,
      review: 1,
      validated: 2,
      integrated: 1,
    });
    expect(
      documentTypes([
        invoice(),
        invoice({ filename: 'SCAN.PDF' }),
        invoice({ filename: 'unknown' }),
      ]),
    ).toEqual([
      { label: 'PDF', count: 2 },
      { label: 'Unknown', count: 1 },
    ]);
  });
  it('uses upload cohorts without audit events and excludes out-of-period uploads', () => {
    const { buckets } = processingTrend(
      [
        { status: 'INTEGRATED', created_at: '2026-09-15T12:00:00' },
        { status: 'REVIEW_REQUIRED', created_at: '2026-09-15T13:00:00' },
        { status: 'VALIDATED', created_at: '2026-08-01T12:00:00' },
        { status: 'UPLOADED', created_at: '2026-09-16T12:00:00' },
      ],
      7,
      new Date('2026-09-15T12:00:00Z'),
    );
    expect(buckets).toHaveLength(7);
    expect(buckets.at(-1)).toEqual({ date: '2026-09-15', uploaded: 2, validated: 1 });
    expect(buckets.slice(0, -1).every((day) => day.uploaded === 0 && day.validated === 0)).toBe(
      true,
    );
  });
});

describe('overview presentation', () => {
  it('loads real metrics once and preserves links and the processing dialog', async () => {
    vi.mocked(api.invoices).mockResolvedValue([invoice()]);
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading dashboard');
    const metrics = await screen.findByLabelText('Invoice metrics');
    expect(within(metrics).getByText('Total Invoices')).toBeVisible();
    expect(metrics.children).toHaveLength(4);
    expect(api.invoices).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'INV-001' })).toHaveAttribute(
      'href',
      '/invoices/inv-1',
    );
    expect(screen.getByRole('link', { name: /View Review Queue/ })).toHaveAttribute(
      'href',
      '/review',
    );
    expect(screen.getByRole('link', { name: /Manage Integrations/ })).toHaveAttribute(
      'href',
      '/integrations',
    );
    expect(screen.queryByText('View Analytics')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Process New Invoice' }));
    expect(screen.getByRole('dialog', { name: 'Process an invoice' })).toBeVisible();
    expect(screen.getByLabelText('Upload invoice PDF')).toBeVisible();
  });
  it('shows empty charts and table without fabricated data', async () => {
    vi.mocked(api.invoices).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Your invoice workspace starts here')).toBeVisible();
    expect(screen.getByText('No invoices yet')).toBeVisible();
    expect(screen.getByText('No activity in this period')).toBeVisible();
  });
  it('provides a safe error and a working retry', async () => {
    vi.mocked(api.invoices)
      .mockRejectedValueOnce(new Error('private stack trace'))
      .mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).not.toHaveTextContent('private stack trace');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Your invoice workspace starts here')).toBeVisible();
  });
});

describe('shell interactions', () => {
  it('opens navigation, locks scrolling, and closes after following a route', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(document.body.style.overflow).toBe('hidden');
    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' });
    fireEvent.click(within(drawer).getByRole('link', { name: 'Invoices' }));
    expect(drawer).not.toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
  it('searches on submission and links to the matching existing invoice route', async () => {
    vi.mocked(api.invoices).mockResolvedValue([invoice()]);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(api.invoices).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gulf' } });
    fireEvent.submit(screen.getByRole('search'));
    const link = await screen.findByRole('link', { name: /INV-001 Gulf Supplies/ });
    expect(link).toHaveAttribute('href', '/invoices/inv-1');
    fireEvent.click(link);
    await waitFor(() => expect(screen.queryByLabelText('Search results')).not.toBeInTheDocument());
  });
  it('shows a helpful no-match state and clears it with Escape', async () => {
    vi.mocked(api.invoices).mockResolvedValue([invoice()]);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'No such vendor' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByText('0 matching invoices')).toBeVisible();
    expect(screen.getByText('Try another invoice number, supplier, or filename.')).toBeVisible();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByLabelText('Search results')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('handles search failures safely and allows another submission', async () => {
    vi.mocked(api.invoices)
      .mockRejectedValueOnce(new Error('private error'))
      .mockResolvedValueOnce([invoice()]);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gulf' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByText('Search unavailable. Please try again.')).toBeVisible();
    expect(screen.queryByText('private error')).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByRole('link', { name: /INV-001 Gulf Supplies/ })).toBeVisible();
  });

  it('dismisses results when focus leaves search without discarding the query', async () => {
    vi.mocked(api.invoices).mockResolvedValue([invoice()]);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Gulf' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByText('1 matching invoices')).toBeVisible();
    fireEvent.blur(input, {
      relatedTarget: screen.getByRole('button', { name: 'Open navigation' }),
    });
    expect(screen.queryByLabelText('Search results')).not.toBeInTheDocument();
    expect(input).toHaveValue('Gulf');
  });

  it('keeps a pending search when disabling its submit button moves focus to the body', async () => {
    let finish!: (value: Invoice[]) => void;
    vi.mocked(api.invoices).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gulf' } });
    fireEvent.submit(screen.getByRole('search'));
    fireEvent.blur(screen.getByRole('button', { name: 'Submit search' }), { relatedTarget: null });
    finish([invoice()]);
    expect(await screen.findByText('1 matching invoices')).toBeVisible();
  });

  it('dismisses search results on an outside click', async () => {
    vi.mocked(api.invoices).mockResolvedValue([invoice()]);
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gulf' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByText('1 matching invoices')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(screen.queryByLabelText('Search results')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Gulf');
  });
});

describe('redesigned invoice workspace', () => {
  it('keeps the selected review invoice available after validation removes it from the queue', async () => {
    const current = invoice({ status: 'REVIEW_REQUIRED' });
    vi.mocked(api.invoices).mockResolvedValue([current]);
    vi.mocked(api.invoice).mockResolvedValue(current);
    vi.mocked(api.action).mockResolvedValue(invoice({ status: 'VALIDATED' }));
    render(
      <MemoryRouter>
        <ReviewQueue />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Re-run validation' }));
    expect(await screen.findByRole('button', { name: 'Approve invoice' })).toBeVisible();
    expect(screen.getByText('Review queue is clear')).toBeVisible();
    expect(api.action).toHaveBeenCalledWith('inv-1', 'validate', undefined);
  });
  it('supports keyboard tabs and retains the real source document URL', async () => {
    vi.mocked(api.invoice).mockResolvedValue(invoice());
    render(
      <MemoryRouter>
        <InvoiceWorkspace id="inv-1" />
      </MemoryRouter>,
    );
    const overview = await screen.findByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Extracted Data' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Extracted Data');
    fireEvent.click(screen.getByRole('tab', { name: 'Document' }));
    expect(screen.getByRole('link', { name: /Open PDF/ })).toHaveAttribute(
      'href',
      '/api/invoices/inv-1/document',
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Document' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
  });
});
