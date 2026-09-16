import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle, Search, X } from 'lucide-react';
import { api } from '../services/api';
import type { Invoice } from '../types';

export function WorkspaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Invoice[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const revision = useRef(0);
  const container = useRef<HTMLDivElement>(null);
  const resultsOpen = results !== null || error || busy;
  useEffect(() => {
    if (!resultsOpen) return;
    const dismissOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        revision.current++;
        setResults(null);
        setError(false);
        setBusy(false);
      }
    };
    document.addEventListener('click', dismissOutside, true);
    return () => document.removeEventListener('click', dismissOutside, true);
  }, [resultsOpen]);
  function clear() {
    revision.current++;
    setResults(null);
    setQuery('');
    setError(false);
    setBusy(false);
  }
  async function search() {
    const term = query.trim().toLowerCase();
    if (!term) return;
    const current = ++revision.current;
    setBusy(true);
    setError(false);
    setResults(null);
    try {
      const invoices = await api.invoices();
      if (current === revision.current)
        setResults(
          invoices.filter((invoice) =>
            [invoice.invoice_number, invoice.supplier_name, invoice.filename].some((value) =>
              value?.toLowerCase().includes(term),
            ),
          ),
        );
    } catch {
      if (current === revision.current) setError(true);
    } finally {
      if (current === revision.current) setBusy(false);
    }
  }
  return (
    <div
      ref={container}
      className="workspace-search"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          revision.current++;
          setResults(null);
          setError(false);
          setBusy(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') clear();
      }}
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <Search size={17} aria-hidden="true" />
        <input
          aria-label="Search invoices"
          placeholder="Search invoices…"
          value={query}
          onChange={(event) => {
            revision.current++;
            setQuery(event.target.value);
            setResults(null);
            setError(false);
            setBusy(false);
          }}
        />
        {query && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={clear}>
            <X size={15} />
          </button>
        )}
        <button
          type="submit"
          className="search-submit"
          disabled={!query.trim() || busy}
          aria-label="Submit search"
        >
          {busy ? <LoaderCircle size={15} className="spin" /> : <span>Search</span>}
        </button>
      </form>
      {resultsOpen && (
        <div className="search-results" aria-label="Search results">
          <p role="status">
            {busy
              ? 'Searching invoices…'
              : error
                ? 'Search unavailable. Please try again.'
                : `${results?.length} matching invoices`}
          </p>
          {results?.length === 0 && <p>Try another invoice number, supplier, or filename.</p>}
          {results?.slice(0, 8).map((invoice) => (
            <Link key={invoice.id} to={`/invoices/${invoice.id}`} onClick={clear}>
              <strong>{invoice.invoice_number || invoice.filename}</strong>
              <span>{invoice.supplier_name || 'Awaiting extraction'}</span>
            </Link>
          ))}
          {results && results.length > 8 && (
            <p>Showing the first 8 matches. Refine your search to find more.</p>
          )}
        </div>
      )}
    </div>
  );
}
