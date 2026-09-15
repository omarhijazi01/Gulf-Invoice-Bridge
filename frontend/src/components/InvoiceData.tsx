import { backendUrl } from '../services/api';
import type { Invoice } from '../types';
import { amount, dateTime, human, StatusBadge } from './Common';
import { fieldLabel } from './InvoiceForm';
export function InvoiceData({ invoice }: { invoice: Invoice }) {
  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Document information</h2>
            <p>
              {invoice.filename} {invoice.is_demo ? '· Fictional demo document' : ''}
            </p>
          </div>
          <a
            className="text-link"
            href={backendUrl(`/api/invoices/${invoice.id}/document`)}
            target="_blank"
            rel="noreferrer"
          >
            View source PDF ↗
          </a>
        </div>
        <dl className="data-grid">
          {(
            [
              'invoice_number',
              'invoice_date',
              'supplier_name',
              'supplier_tax_number',
              'customer_name',
              'customer_tax_number',
              'currency',
            ] as const
          ).map((key) => (
            <div key={key}>
              <dt>{fieldLabel(key)}</dt>
              <dd className={!invoice[key] ? 'missing' : ''}>{invoice[key] || 'Missing'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Financial information</h2>
            <p>Amounts in {invoice.currency || 'unidentified currency'} · line totals before tax</p>
          </div>
        </div>
        <div className="financial-totals">
          {(['subtotal', 'tax_amount', 'total_amount'] as const).map((key) => (
            <div key={key}>
              <span>{fieldLabel(key)}</span>
              <strong>{amount(invoice[key])}</strong>
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Tax rate</th>
                <th>Net total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description || 'Missing'}</td>
                  <td>{item.quantity ?? '—'}</td>
                  <td>{amount(item.unit_price)}</td>
                  <td>{item.tax_rate ?? '—'}%</td>
                  <td>{amount(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Extraction evidence</h2>
            <p>
              {invoice.evidence[0]?.provider === 'demo'
                ? 'DEMO PARSER · Illustrative confidence, not AI inference'
                : 'AI confidence is an estimate, not proof of correctness'}
            </p>
          </div>
          <span className="muted">{invoice.processing_ms ?? 0} ms</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Original extracted value</th>
                <th>Confidence</th>
                <th>Extraction signal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.evidence.map((e) => (
                <tr key={e.id}>
                  <td>{fieldLabel(e.field)}</td>
                  <td>{e.raw_value || 'Missing'}</td>
                  <td>
                    <div className="confidence">
                      <div>
                        <i style={{ width: `${e.confidence ?? 0}%` }} />
                      </div>
                      {e.confidence === null ? 'Unknown' : `${e.confidence}%`}
                    </div>
                  </td>
                  <td>{e.uncertain ? 'Uncertain' : 'Extracted'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoice.reviewed_at && (
          <p className="panel-padding fineprint">
            Human review saved {dateTime(invoice.reviewed_at)}. Original evidence is preserved;
            current values are shown above.
          </p>
        )}
      </section>
    </>
  );
}
export function Timeline({ invoice }: { invoice: Invoice }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Processing history</h2>
          <p>Persistent audit trail</p>
        </div>
        <StatusBadge status={invoice.status} />
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
    </section>
  );
}
