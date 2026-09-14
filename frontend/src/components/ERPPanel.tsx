import { useCallback, useState } from 'react';
import type { Invoice } from '../types';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, LoadingState, StatusBadge } from './Common';
import { IntegrationLogTable } from './IntegrationLogTable';
export function ERPPanel({
  invoice,
  busy,
  onAction,
}: {
  invoice: Invoice;
  busy: boolean;
  onAction: (action: string, scenario?: string) => void;
}) {
  const eligible = ['APPROVED', 'INTEGRATION_FAILED', 'INTEGRATED', 'INTEGRATING'].includes(
    invoice.status,
  );
  const load = useCallback(
    () => (eligible ? api.payload(invoice.id) : Promise.resolve(null)),
    [invoice.id, eligible],
  );
  const { data, error, loading, reload } = useResource(load);
  const [scenario, setScenario] = useState('SUCCESS');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>ERP integration</h2>
            <p>Backend → connector → independent local ERP API</p>
          </div>
          <span className="pill">SIMULATION</span>
        </div>
        <div className="panel-padding">
          {invoice.erp_reference ? (
            <div className="success-notice">
              <StatusBadge status="SUCCESS" />
              <strong>{invoice.erp_reference}</strong>
              <span>Persisted in the independent ERP database</span>
            </div>
          ) : (
            <p className="muted">
              {eligible
                ? 'Approved data is ready for delivery. Every request is recorded.'
                : 'Validate and approve this invoice to unlock its ERP payload.'}
            </p>
          )}
          {['APPROVED', 'INTEGRATION_FAILED'].includes(invoice.status) && (
            <div className="integration-controls">
              <label>
                Demo response scenario
                <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  <option value="SUCCESS">Success · HTTP 200</option>
                  <option value="401">Unauthorized · HTTP 401</option>
                  <option value="400">Bad request · HTTP 400</option>
                  <option value="500">Server error · HTTP 500</option>
                  <option value="TIMEOUT">Timeout · no response</option>
                </select>
              </label>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  onAction(
                    invoice.status === 'INTEGRATION_FAILED' ? 'retry-integration' : 'integrate',
                    scenario,
                  )
                }
              >
                {busy
                  ? 'Sending…'
                  : invoice.status === 'INTEGRATION_FAILED'
                    ? 'Retry integration'
                    : 'Integrate with ERP'}
              </button>
            </div>
          )}
        </div>
        {eligible && (
          <>
            <div className="json-heading">
              <h3>Structured ERP payload</h3>
              <button
                className="button secondary"
                disabled={!data}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    setCopied(true);
                    setCopyError('');
                  } catch {
                    setCopyError('Clipboard access was denied. Select the payload text to copy.');
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            {copyError && <ErrorState message={copyError} />}
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} retry={reload} />
            ) : (
              <pre className="json-viewer" tabIndex={0}>
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </>
        )}
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Integration history</h2>
            <p>Every attempt, including failures and retries</p>
          </div>
        </div>
        <IntegrationLogTable
          logs={invoice.integration_logs.map((log) => ({ ...log, invoice_id: invoice.id }))}
        />
      </section>
    </>
  );
}
