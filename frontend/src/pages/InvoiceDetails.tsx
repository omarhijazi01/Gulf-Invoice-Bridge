import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Play, SquarePen } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/Common';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceData, Timeline } from '../components/InvoiceData';
import { ValidationSummary } from '../components/ValidationSummary';
import { ERPPanel } from '../components/ERPPanel';
import type { InvoiceFields } from '../types';
export function InvoiceDetails() {
  const { id = '' } = useParams();
  const load = useCallback(() => api.invoice(id), [id]);
  const { data: invoice, error, loading, reload, setData } = useResource(load);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('overview');
  async function action(name: string, scenario?: string) {
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      const updated = await api.action(id, name, scenario);
      setData(updated);
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
      setData(await api.edit(id, values));
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
    <>
      <Link className="back-link" to="/invoices">
        <ArrowLeft size={15} /> All invoices
      </Link>
      <PageHeader
        eyebrow={invoice.is_demo ? 'FICTIONAL DEMO DOCUMENT' : 'INVOICE WORKSPACE'}
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
          ['overview', 'Invoice & validation'],
          ['erp', 'ERP payload & integration'],
          ['history', 'Processing history'],
        ].map(([key, label]) => (
          <button role="tab" aria-selected={tab === key} key={key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {editing ? (
          <InvoiceForm
            invoice={invoice}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(false)}
          />
        ) : tab === 'overview' ? (
          <>
            <InvoiceData invoice={invoice} />
            <ValidationSummary rules={invoice.validation_results} />
          </>
        ) : tab === 'erp' ? (
          <ERPPanel invoice={invoice} busy={busy} onAction={action} />
        ) : (
          <Timeline invoice={invoice} />
        )}
      </div>
    </>
  );
}
