import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Invoice } from '../types';
import { amount, EmptyState, StatusBadge } from './Common';

export function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
  const recent = [...invoices].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  return (
    <section className="panel recent-invoices" aria-labelledby="recent-title">
      <div className="panel-header">
        <h2 id="recent-title">Recent Invoices</h2>
        <Link className="text-link" to="/invoices">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      {recent.length ? (
        <div className="table-wrap" role="region" aria-label="Recent invoices table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <div className="recent-identifier">
                      <Link
                        className="invoice-link truncate"
                        title={invoice.invoice_number || invoice.filename}
                        to={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoice_number || invoice.filename}
                      </Link>
                      {invoice.is_demo && <span className="sample-tag">DEMO</span>}
                    </div>
                  </td>
                  <td>
                    <span className="truncate" title={invoice.supplier_name || undefined}>
                      {invoice.supplier_name || 'Awaiting extraction'}
                    </span>
                  </td>
                  <td className="tabular nowrap">
                    {amount(invoice.total_amount)} {invoice.currency || ''}
                  </td>
                  <td>
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="nowrap">
                    <time dateTime={invoice.invoice_date || invoice.created_at.slice(0, 10)}>
                      {invoice.invoice_date || invoice.created_at.slice(0, 10)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Your invoice workspace starts here"
          description="Process an invoice to see its progress from document to ERP."
        />
      )}
    </section>
  );
}
