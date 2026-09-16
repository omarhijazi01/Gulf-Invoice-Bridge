import { useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, LoadingState, PageHeader, human } from '../components/Common';
import { InvoiceTable } from '../components/InvoiceTable';
import { ProcessInvoice } from '../components/ProcessInvoice';
export function Invoices({ review = false }: { review?: boolean }) {
  const { data, error, loading, reload } = useResource(api.invoices);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const filtered = (data ?? [])
    .filter(
      (i) =>
        (!review || i.status === 'REVIEW_REQUIRED') &&
        (status === 'ALL' || i.status === status) &&
        `${i.invoice_number} ${i.supplier_name} ${i.filename}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'supplier'
        ? (a.supplier_name ?? '').localeCompare(b.supplier_name ?? '')
        : b.created_at.localeCompare(a.created_at),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  return (
    <>
      <PageHeader
        title={review ? 'Review queue' : 'Invoices'}
        description={
          review
            ? 'Resolve validation issues before invoices can move to approval.'
            : 'Manage and track all processed invoices.'
        }
      >
        <ProcessInvoice label="Upload Invoice" />
      </PageHeader>
      {review && (
        <div className="notice">
          Human review is a required control. Save corrections, re-run validation, then approve.
        </div>
      )}
      <section className="panel invoice-list-panel">
        <div className="filters">
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Search invoices"
              placeholder="Search invoice number or supplier…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {!review && (
            <select
              aria-label="Filter status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              {[
                'UPLOADED',
                'EXTRACTED',
                'REVIEW_REQUIRED',
                'VALIDATED',
                'APPROVED',
                'INTEGRATED',
                'INTEGRATION_FAILED',
              ].map((s) => (
                <option key={s} value={s}>
                  {human(s)}
                </option>
              ))}
            </select>
          )}
          <select aria-label="Sort invoices" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="supplier">Supplier A–Z</option>
          </select>
          <button className="button secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        {error ? (
          <ErrorState message={error} retry={reload} />
        ) : loading ? (
          <LoadingState />
        ) : (
          <InvoiceTable
            invoices={filtered.slice((current - 1) * 10, current * 10)}
            review={review}
          />
        )}
        <div className="pagination">
          <span>
            {filtered.length ? (current - 1) * 10 + 1 : 0}–{Math.min(current * 10, filtered.length)}{' '}
            of {filtered.length} invoices · Page {current} of {pages}
          </span>
          <div>
            <button
              className="button secondary"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </button>
            <button
              className="button secondary"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
