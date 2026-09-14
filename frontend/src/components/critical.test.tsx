import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StatusBadge } from './Common';
import { ValidationSummary } from './ValidationSummary';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceTable } from './InvoiceTable';
import type { Invoice } from '../types';
const invoice = {
  id: 'test',
  invoice_number: 'INV-001',
  filename: 'invoice.pdf',
  supplier_name: 'Dune LLC',
  supplier_tax_number: null,
  customer_name: 'Oasis LLC',
  customer_tax_number: '123',
  currency: 'AED',
  invoice_date: '2026-09-13',
  subtotal: '1000',
  tax_amount: '50',
  total_amount: '1050',
  items: [
    { description: 'Service', quantity: '2', unit_price: '500', tax_rate: '5', total: '1000' },
  ],
  status: 'REVIEW_REQUIRED',
  version: 2,
  created_at: '2026-09-13',
  validation_results: [],
  evidence: [],
  events: [],
  integration_logs: [],
} as unknown as Invoice;
describe('review controls', () => {
  it('communicates failure without relying on color', () => {
    render(<StatusBadge status="INTEGRATION_FAILED" />);
    expect(screen.getByText('Integration failed')).toBeVisible();
  });
  it('shows deterministic validation results separately', () => {
    render(
      <ValidationSummary
        rules={[{ rule: 'tax', status: 'ERROR', severity: 'ERROR', message: 'Tax mismatch' }]}
      />,
    );
    expect(screen.getByText('Tax mismatch')).toBeVisible();
    expect(screen.getByText(/independent of extraction confidence/)).toBeVisible();
  });
  it('saves corrected values with the current version', async () => {
    const save = vi.fn();
    render(<InvoiceForm invoice={invoice} busy={false} onSave={save} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Supplier tax number'), {
      target: { value: '100123456700003' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save corrections' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ supplier_tax_number: '100123456700003', version: 2 }),
      ),
    );
  });
  it('links invoice rows to the correct detail page', () => {
    render(
      <MemoryRouter>
        <InvoiceTable invoices={[invoice]} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'INV-001' })).toHaveAttribute('href', '/invoices/test');
  });
});
