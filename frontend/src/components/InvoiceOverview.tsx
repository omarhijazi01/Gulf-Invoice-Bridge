import type { Invoice } from '../types';
import { backendUrl } from '../services/api';
import { amount, dateTime, human, StatusBadge } from './Common';

export function DocumentPreview({ invoice }: { invoice: Invoice }) {
  const url = backendUrl(`/api/invoices/${invoice.id}/document`);
  return (
    <section className="panel document-preview">
      <div className="panel-header">
        <div>
          <h2>Source document</h2>
          <p>
            {invoice.filename}
            {invoice.is_demo ? ' · Fictional sample' : ''}
          </p>
        </div>
        <a className="text-link" href={url} target="_blank" rel="noreferrer">
          Open PDF ↗
        </a>
      </div>
      <object data={url} type="application/pdf" aria-label={`Source PDF: ${invoice.filename}`}>
        <p className="panel-padding">
          PDF preview is unavailable in this browser.{' '}
          <a className="text-link" href={url} target="_blank" rel="noreferrer">
            Open the source PDF
          </a>
        </p>
      </object>
    </section>
  );
}

export function InvoiceOverview({ invoice }: { invoice: Invoice }) {
  return (
    <div className="invoice-overview-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>Key Information</h2>
        </div>
        <dl className="key-information">
          {[
            ['Invoice number', invoice.invoice_number],
            ['Vendor', invoice.supplier_name],
            ['Invoice date', invoice.invoice_date],
            ['Customer', invoice.customer_name],
            ['Subtotal', amount(invoice.subtotal)],
            ['Tax amount', amount(invoice.tax_amount)],
            ['Total amount', amount(invoice.total_amount)],
            ['Currency', invoice.currency],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'Awaiting extraction'}</dd>
            </div>
          ))}
        </dl>
        <div className="panel-padding">
          <StatusBadge status={invoice.status} />
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Processing Status</h2>
        </div>
        <ol className="timeline">
          {invoice.events.map((event) => (
            <li key={event.id}>
              <span className="event-dot" />
              <div>
                <strong>{human(event.action)}</strong>
                <p>{event.detail}</p>
                <small>{dateTime(event.timestamp)}</small>
              </div>
            </li>
          ))}
        </ol>
        {!invoice.events.length && <p className="panel-padding muted">No processing events yet.</p>}
      </section>
      <DocumentPreview invoice={invoice} />
    </div>
  );
}
