import { useCallback, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Play, SquarePen } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/Common';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceData, Timeline } from '../components/InvoiceData';
import { ValidationSummary } from '../components/ValidationSummary';
import { ERPPanel } from '../components/ERPPanel';
import type { Invoice, InvoiceFields } from '../types';
import { InvoiceOverview, DocumentPreview } from '../components/InvoiceOverview';
export function InvoiceDetails() {
  const { id = '' } = useParams();
  return <InvoiceWorkspace key={id} id={id} />;
}
export function InvoiceWorkspace({
  id,
  embedded = false,
  onUpdated,
}: {
  id: string;
  embedded?: boolean;
  onUpdated?: (invoice: Invoice) => void;
}) {
  const load = useCallback(() => api.invoice(id), [id]);
  const { data: invoice, error, loading, reload, setData } = useResource(load);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState(embedded ? 'data' : 'overview');
  const tabsId = useId();
  async function action(name: string, scenario?: string) {
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      const updated = await api.action(id, name, scenario);
      setData(updated);
      onUpdated?.(updated);
      setNotice(
        updated.status === 'INTEGRATION_FAILED'
          ? 'Integration failed. Review the attempt below and retry when ready.'
          : name === 'validate' && updated.status === 'VALIDATED'
            ? 'Validation Passed'
            : `Action completed: ${name.replaceAll('-', ' ')}`,
      );
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(values: InvoiceFields & { version: number }) {
    setBusy(true);
    setActionError('');
    try {
      const updated = await api.edit(id, values);
      setData(updated);
      onUpdated?.(updated);
      setEditing(false);
      setNotice('Corrections saved. Re-run validation before approval.');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorState message={error} retry={reload} />;
  if (loading || !invoice) return <LoadingState />;
  return (
    <div className={`invoice-workspace ${embedded ? 'embedded-workspace' : ''}`}>
      {!embedded && (
        <Link className="back-link" to="/invoices">
          <ArrowLeft size={15} /> All invoices
        </Link>
      )}
      <PageHeader
        eyebrow="INVOICE DETAILS"
        title={invoice.invoice_number || invoice.filename}
        description={invoice.supplier_name || 'Document uploaded. Extract its contents to begin.'}
      >
        <StatusBadge status={invoice.status} />
        {invoice.status === 'UPLOADED' && (
          <button disabled={busy} className="button primary" onClick={() => action('extract')}>
            <Play size={16} />
            {busy ? 'Extracting…' : 'Extract & validate'}
          </button>
        )}
        {['EXTRACTED', 'REVIEW_REQUIRED', 'VALIDATED'].includes(invoice.status) && !editing && (
          <>
            <button disabled={busy} className="button secondary" onClick={() => setEditing(true)}>
              <SquarePen size={15} />
              Edit fields
            </button>
            <button disabled={busy} className="button secondary" onClick={() => action('validate')}>
              Re-run validation
            </button>
          </>
        )}
        {invoice.status === 'VALIDATED' && !editing && (
          <button disabled={busy} className="button primary" onClick={() => action('approve')}>
            <Check size={16} />
            Approve invoice
          </button>
        )}
      </PageHeader>
      {actionError && <ErrorState message={actionError} />}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {invoice.last_error && <ErrorState message={invoice.last_error} />}
      {invoice.status === 'REVIEW_REQUIRED' && (
        <div className="review-notice">
          <strong>Review required</strong>
          <span>Resolve the issues below, save your corrections, and re-run validation.</span>
          {invoice.is_demo && !invoice.supplier_tax_number && (
            <small>
              Sample correction: supplier tax number <code>100123456700003</code>
            </small>
          )}
        </div>
      )}
      <div className="tabs" role="tablist" aria-label="Invoice sections">
        {[
          ['overview', 'Overview'],
          ['data', 'Extracted Data'],
          ['validation', 'Validation'],
          ['erp', 'Integration'],
          ['document', 'Document'],
          ['history', 'History'],
        ].map(([key, label]) => (
          <button
            role="tab"
            id={`${tabsId}-${key}`}
            aria-controls={`${tabsId}-panel`}
            tabIndex={tab === key ? 0 : -1}
            aria-selected={tab === key}
            key={key}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const tabs = Array.from(
                event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]',
                ),
              );
              const index = tabs.indexOf(event.currentTarget);
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft'
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                tabs[next].focus();
                tabs[next].click();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`} tabIndex={0}>
        {editing ? (
          <InvoiceForm
            invoice={invoice}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(false)}
          />
        ) : tab === 'overview' ? (
          <InvoiceOverview invoice={invoice} />
        ) : tab === 'data' ? (
          <InvoiceData invoice={invoice} />
        ) : tab === 'validation' ? (
          <ValidationSummary rules={invoice.validation_results} />
        ) : tab === 'document' ? (
          <DocumentPreview invoice={invoice} />
        ) : tab === 'erp' ? (
          <ERPPanel invoice={invoice} busy={busy} onAction={action} />
        ) : (
          <Timeline invoice={invoice} />
        )}
      </div>
    </div>
  );
}
