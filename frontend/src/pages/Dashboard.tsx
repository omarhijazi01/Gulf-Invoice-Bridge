import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, UserCheck, Workflow } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import {
  dateTime,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
} from '../components/Common';
import { InvoiceTable } from '../components/InvoiceTable';
import { ProcessInvoice } from '../components/ProcessInvoice';
const load = () => Promise.all([api.stats(), api.invoices(), api.system()]);
export function Dashboard() {
  const { data, error, loading, reload } = useResource(load);
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS OVERVIEW"
        title="Invoice Intelligence & Integration"
        description="Turn invoice documents into validated, enterprise-ready data."
      >
        <button className="button secondary" onClick={reload}>
          Refresh
        </button>
        <ProcessInvoice />
      </PageHeader>
      <section className="workflow-banner">
        <div>
          <span className="tiny-label">CONTROLLED BY DESIGN</span>
          <h2>
            AI extracts. Rules validate.
            <br />
            Humans approve. APIs integrate.
          </h2>
          <p>One traceable workflow. Every decision accounted for.</p>
        </div>
        <div className="flow-stages">
          {[
            [FileText, '01', 'Extract'],
            [ShieldCheck, '02', 'Validate'],
            [UserCheck, '03', 'Approve'],
            [Workflow, '04', 'Integrate'],
          ].map(([Icon, number, label]) => {
            const Symbol = Icon as typeof FileText;
            return (
              <div key={String(label)}>
                <span className="flow-icon">
                  <Symbol size={23} />
                </span>
                <small>{String(number)}</small>
                <strong>{String(label)}</strong>
              </div>
            );
          })}
        </div>
      </section>
      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <LoadingState />
      ) : (
        data &&
        (() => {
          const [stats, invoices, system] = data;
          return (
            <>
              <div className="metrics">
                <MetricCard
                  label="Invoices processed"
                  value={stats.processed}
                  note={`${stats.total_invoices} documents in workspace`}
                />
                <MetricCard
                  label="Validation success"
                  value={`${stats.validation_success_rate}%`}
                  note="Current validated / processed invoices"
                />
                <MetricCard
                  label="Needs review"
                  value={stats.needs_review}
                  note="Human attention required"
                  accent
                />
                <MetricCard
                  label="Integration success"
                  value={`${stats.integration_success_rate}%`}
                  note={`${stats.successful_attempts} of ${stats.integration_attempts} attempts succeeded`}
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Integration performance</h2>
                      <p>Last {stats.performance.length} attempts · response time in ms</p>
                    </div>
                    <span className="pill">LOCAL SIMULATOR</span>
                  </div>
                  {stats.performance.length ? (
                    <div
                      className="chart"
                      role="img"
                      aria-label="Integration attempt durations; green means success, amber means failed"
                    >
                      {stats.performance.map((log) => (
                        <div className="bar-column" key={log.id}>
                          <span>{log.duration_ms}</span>
                          <div
                            className={`bar ${log.result === 'SUCCESS' ? 'success' : 'failed'}`}
                            style={{
                              height: Math.max(
                                8,
                                (log.duration_ms /
                                  Math.max(...stats.performance.map((l) => l.duration_ms), 1)) *
                                  100,
                              ),
                            }}
                          />
                          <small>#{log.id}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No integration attempts yet"
                      description="Approve an invoice and send it to the local ERP."
                    />
                  )}
                  <div className="chart-legend">
                    <span>
                      <i className="green-dot" /> Success
                    </span>
                    <span>
                      <i className="amber-dot" /> Failed
                    </span>
                    <strong>
                      {stats.average_response_ms} ms <small>average response</small>
                    </strong>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>System health</h2>
                      <p>Live local service checks</p>
                    </div>
                    <CheckCircle2 size={19} className="green" />
                  </div>
                  <div className="health-list">
                    {[
                      ['Document processing', system.document_processing],
                      ['Extraction provider', system.extraction],
                      ['Validation engine', system.validation],
                      ['ERP integration', system.erp],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong className={value === 'Offline' ? 'orange' : ''}>
                          <i className={value === 'Offline' ? 'amber-dot' : 'green-dot'} />
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="panel-foot">
                    {system.demo_mode ? 'DEMO MODE' : 'LOCAL MODE'}{' '}
                    <span>Fictional samples are labeled throughout.</span>
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent invoices</h2>
                    <p>Your latest documents and their progress</p>
                  </div>
                  <Link className="text-link" to="/invoices">
                    View all invoices <ArrowRight size={15} />
                  </Link>
                </div>
                <InvoiceTable invoices={invoices.slice(0, 5)} />
              </section>
              <section className="panel activity">
                <div className="panel-header">
                  <div>
                    <h2>Recent activity</h2>
                    <p>Persisted workflow events</p>
                  </div>
                  <Link to="/logs" className="text-link">
                    Integration logs <ArrowRight size={15} />
                  </Link>
                </div>
                {stats.recent_activity.length ? (
                  <div className="activity-grid">
                    {stats.recent_activity.slice(0, 4).map((event) => (
                      <Link to={`/invoices/${event.invoice_id}`} key={event.id}>
                        <span className="event-dot" />
                        <div>
                          <strong>{event.detail}</strong>
                          <small>{dateTime(event.timestamp)}</small>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="panel-padding muted">
                    Process an invoice to begin the audit trail.
                  </p>
                )}
              </section>
            </>
          );
        })()
      )}
    </>
  );
}
