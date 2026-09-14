import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Invoice } from '../types';
import { amount, EmptyState, StatusBadge } from './Common';
export function InvoiceTable({
  invoices,
  review = false,
}: {
  invoices: Invoice[];
  review?: boolean;
}) {
  if (!invoices.length)
    return (
      <EmptyState
        title={review ? 'No invoices need review' : 'No matching invoices'}
        description={
          review
            ? 'New validation issues will appear here.'
            : 'Process a sample or upload a PDF to get started.'
        }
      />
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice / supplier</th>
            <th>Amount</th>
            <th>{review ? 'Issue' : 'Validation'}</th>
            <th>Workflow status</th>
            <th>ERP status</th>
            <th>Date</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td>
                <Link className="invoice-link" to={`/invoices/${i.id}`}>
                  {i.invoice_number || i.filename}
                </Link>
                {i.is_demo && <span className="sample-tag">DEMO</span>}
                <small>{i.supplier_name || 'Awaiting extraction'}</small>
              </td>
              <td className="tabular">
                <strong>{amount(i.total_amount)}</strong>
                <small>{i.currency || '—'}</small>
              </td>
              <td>
                {review ? (
                  <span className="issue-text">
                    {i.validation_results.find((r) => r.status !== 'PASS')?.message || i.last_error}
                  </span>
                ) : (
                  <StatusBadge
                    status={
                      !i.validation_results.length
                        ? 'PENDING'
                        : i.validation_results.some((r) => r.status === 'ERROR')
                          ? 'ERROR'
                          : i.validation_results.some((r) => r.status === 'WARNING')
                            ? 'WARNING'
                            : 'PASS'
                    }
                  />
                )}
              </td>
              <td>
                <StatusBadge status={i.status} />
              </td>
              <td className="muted">
                {i.erp_reference ||
                  (['INTEGRATION_FAILED', 'INTEGRATING'].includes(i.status)
                    ? 'Awaiting delivery'
                    : 'Not sent')}
              </td>
              <td className="nowrap muted">{i.invoice_date || i.created_at.slice(0, 10)}</td>
              <td>
                <Link
                  className="icon-button"
                  to={`/invoices/${i.id}`}
                  aria-label={`Open ${i.invoice_number || i.filename}`}
                >
                  <ArrowUpRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
