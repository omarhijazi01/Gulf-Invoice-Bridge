import { Link } from 'react-router-dom';
import { Database, ArrowRight, Plug } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { dateTime, ErrorState, LoadingState, MetricCard, PageHeader } from '../components/Common';
const load = () => Promise.all([api.system(), api.stats()]);
export function Integrations() {
  const { data, error, loading, reload } = useResource(load);
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Monitor your configured ERP connection and invoice delivery."
      >
        <button className="button secondary" onClick={reload}>
          Check connection
        </button>
      </PageHeader>
      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <LoadingState />
      ) : (
        data && (
          <>
            <div className="connection-layout">
              <section className="panel connector-card">
                <div className="connector-icon">
                  <Database size={32} />
                </div>
                <div>
                  <span className="pill">LOCAL SIMULATOR</span>
                  <h2>Mock ERP</h2>
                  <p>Independent HTTP service with its own persistent database.</p>
                  <code>{data[0].erp_endpoint}/api/mock-erp/invoices</code>
                </div>
                <strong className={`badge ${data[0].erp === 'Connected' ? 'positive' : 'warning'}`}>
                  {data[0].erp}
                </strong>
              </section>
              <section className="panel panel-padding">
                <h2>Integration controls</h2>
                <p className="muted">
                  Choose a response scenario on an approved invoice. A failure preserves the
                  approved data and records the request for manual retry.
                </p>
                <div className="integration-flow">
                  <span>Approved invoice</span>
                  <ArrowRight size={18} />
                  <span>Payload transformation</span>
                  <ArrowRight size={18} />
                  <span>ERP connector</span>
                  <ArrowRight size={18} />
                  <span>ERP database</span>
                </div>
                <Link className="button primary" to="/invoices">
                  <Plug size={16} />
                  Open invoices
                </Link>
                <p className="fineprint">
                  Failure scenarios are simulations: HTTP 401, 400, 500 and timeout. No government
                  or commercial ERP connection is configured.
                </p>
              </section>
            </div>
            <div className="metrics">
              <MetricCard
                label="Requests today"
                value={data[1].requests_today}
                note="UTC calendar day"
              />
              <MetricCard
                label="Success rate"
                value={`${data[1].integration_success_rate}%`}
                note="Successful / completed attempts"
              />
              <MetricCard
                label="Average response"
                value={`${data[1].average_response_ms} ms`}
                note="Includes failed attempts"
              />
              <MetricCard
                label="Last success"
                value={data[1].last_success ? data[1].last_success.slice(11, 16) : '—'}
                note={dateTime(data[1].last_success)}
              />
            </div>
          </>
        )
      )}
    </>
  );
}
export function Settings() {
  const { data, error, loading, reload } = useResource(api.system);
  return (
    <>
      <PageHeader
        title="Settings"
        description="View processing and integration configuration. These settings are managed on the server."
      />
      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <LoadingState />
      ) : (
        data && (
          <section className="panel settings-layout">
            <nav className="settings-navigation" aria-label="Settings sections">
              <a href="#settings-general">General</a>
              <a href="#settings-processing">Document processing</a>
              <a href="#settings-integration">Integration</a>
            </nav>
            <div className="settings-content">
              <div className="panel-header">
                <h2>Runtime Settings</h2>
                <span className="badge neutral">Read only</span>
              </div>
              {[
                {
                  id: 'general',
                  title: 'General',
                  fields: [
                    ['Environment', data.environment],
                    ['Database', data.database],
                  ],
                },
                {
                  id: 'processing',
                  title: 'Document processing',
                  fields: [
                    ['Extraction provider', data.ai_provider],
                    ['Demo mode', data.demo_mode ? 'Enabled' : 'Disabled'],
                    ['Supported documents', 'Text-based PDF · Maximum 10 MB'],
                    ['OCR', 'Not supported'],
                  ],
                },
                {
                  id: 'integration',
                  title: 'ERP integration',
                  fields: [
                    ['Connection', data.erp],
                    ['Endpoint', data.erp_endpoint],
                    ['Connector', 'Independent ERP simulator'],
                  ],
                },
              ].map((section) => (
                <section
                  className="settings-section"
                  id={`settings-${section.id}`}
                  key={section.id}
                >
                  <h3>{section.title}</h3>
                  <dl className="settings-fields">
                    {section.fields.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </section>
        )
      )}
    </>
  );
}
