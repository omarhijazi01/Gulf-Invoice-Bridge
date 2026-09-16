import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { amount, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/Common';
import { InvoiceWorkspace } from './InvoiceDetails';

export function ReviewQueue() {
  const { data, error, loading, reload, setData } = useResource(api.invoices);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const invoices = (data || []).filter((invoice) => invoice.status === 'REVIEW_REQUIRED');
  const filtered = invoices.filter((invoice) =>
    `${invoice.invoice_number || ''} ${invoice.supplier_name || ''} ${invoice.filename}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const active = selected || filtered[0]?.id;
  return (
    <div className="review-page">
      <PageHeader
        title="Review Queue"
        description="Review extracted data and resolve validation issues before approval."
      >
        <button className="button secondary" disabled={loading} onClick={reload}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </PageHeader>
      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="review-layout">
          <section className="panel review-list" aria-label="Invoices awaiting review">
            <div className="panel-header">
              <h2>Awaiting review</h2>
              <span className="count-label">{invoices.length}</span>
            </div>
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search review queue"
                placeholder="Search invoices…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="review-cards">
              {filtered.map((invoice) => (
                <button
                  key={invoice.id}
                  className={`review-card ${active === invoice.id ? 'selected' : ''}`}
                  aria-pressed={active === invoice.id}
                  onClick={() => setSelected(invoice.id)}
                >
                  <strong>{invoice.invoice_number || invoice.filename}</strong>
                  <span>{invoice.supplier_name || 'Awaiting extraction'}</span>
                  <span className="review-card-amount">
                    {amount(invoice.total_amount)} {invoice.currency || ''}
                  </span>
                  <small>
                    {invoice.validation_results.find((rule) => rule.status !== 'PASS')?.message ||
                      invoice.last_error ||
                      'Human review required'}
                  </small>
                </button>
              ))}
            </div>
            {!filtered.length && (
              <EmptyState
                title={query ? 'No matching invoices' : 'Review queue is clear'}
                description={
                  query
                    ? 'Try a different invoice number or supplier.'
                    : 'Invoices requiring attention will appear here.'
                }
              />
            )}
          </section>
          <div className="review-detail">
            {active ? (
              <InvoiceWorkspace
                key={active}
                id={active}
                embedded
                onUpdated={(updated) => {
                  setSelected(updated.id);
                  setData(
                    (current) =>
                      current?.map((invoice) => (invoice.id === updated.id ? updated : invoice)) ||
                      null,
                  );
                }}
              />
            ) : (
              <section className="panel">
                <EmptyState
                  title="Ready for the next invoice"
                  description="Select an invoice to inspect its data, correct fields, and run validation."
                />
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
