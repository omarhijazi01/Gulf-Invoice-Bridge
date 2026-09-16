import { Link } from 'react-router-dom';
import { ArrowUpRight, ListChecks, Plug, RefreshCw, ScrollText } from 'lucide-react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, MetricCard, PageHeader } from '../components/Common';
import { ProcessInvoice } from '../components/ProcessInvoice';
import { InvoiceStatusDistribution, ProcessingTrend } from '../components/DashboardCharts';
import { RecentInvoices } from '../components/RecentInvoices';
import { dashboardMetrics } from '../components/dashboardData';

function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard…</span>
      <div className="metrics">
        {[0, 1, 2, 3].map((key) => (
          <div className="metric skeleton-card" key={key}>
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <div className="panel skeleton-chart" />
        <div className="panel skeleton-chart" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: invoices, error, loading, reload } = useResource(api.invoices);
  const metrics = dashboardMetrics(invoices || []);
  return (
    <div className="overview-page">
      <PageHeader
        title="Invoice Operations Overview"
        description="Monitor invoice processing, validation, review, and ERP integration."
      >
        <button
          className="button secondary refresh-button"
          onClick={reload}
          disabled={loading}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
        <ProcessInvoice />
      </PageHeader>
      {error ? (
        <ErrorState message="We couldn’t load your invoices. Please try again." retry={reload} />
      ) : loading ? (
        <DashboardLoading />
      ) : (
        invoices && (
          <>
            <div className="metrics" aria-label="Invoice metrics">
              <MetricCard
                label="Total Invoices"
                value={metrics.total}
                note="Documents in your workspace"
              />
              <MetricCard
                label="Pending Review"
                value={metrics.review}
                note={metrics.review ? 'Requires human attention' : 'No invoices awaiting review'}
                accent
              />
              <MetricCard
                label="Validated"
                value={metrics.validated}
                note="Passed validation, including later stages"
              />
              <MetricCard
                label="Integrated"
                value={metrics.integrated}
                note="Successfully delivered to ERP"
              />
            </div>
            <div className="overview-grid">
              <ProcessingTrend invoices={invoices} />
              <InvoiceStatusDistribution invoices={invoices} />
              <RecentInvoices invoices={invoices} />
              <section className="panel quick-actions" aria-labelledby="quick-actions-title">
                <div className="panel-header">
                  <h2 id="quick-actions-title">Quick Actions</h2>
                </div>
                <div className="quick-action-list">
                  <ProcessInvoice label="Process New Invoice" />
                  <Link className="button secondary" to="/review">
                    <ListChecks size={16} />
                    View Review Queue
                    <ArrowUpRight size={14} />
                  </Link>
                  <Link className="button secondary" to="/integrations">
                    <Plug size={16} />
                    Manage Integrations
                    <ArrowUpRight size={14} />
                  </Link>
                  <Link className="button secondary" to="/logs">
                    <ScrollText size={16} />
                    View Activity Logs
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}
