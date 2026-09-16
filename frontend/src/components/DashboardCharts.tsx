import { useState } from 'react';
import type { Invoice, Status } from '../types';
import { EmptyState, human } from './Common';
import { invoiceStatusDistribution, processingTrend } from './dashboardData';

export function ProcessingTrend({ invoices }: { invoices: Invoice[] }) {
  const [days, setDays] = useState(30);
  const { buckets, bucketSize } = processingTrend(invoices, days);
  const max = Math.max(4, ...buckets.map((bucket) => Math.max(bucket.uploaded, bucket.validated)));
  const ceiling = Math.ceil(max / 4) * 4;
  const width = 520 / buckets.length;
  const hasActivity = buckets.some((bucket) => bucket.uploaded || bucket.validated);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${date}T00:00:00Z`),
    );
  return (
    <section className="panel trend-panel" aria-labelledby="trend-title">
      <div className="panel-header">
        <div>
          <h2 id="trend-title">Invoice Processing Trend</h2>
          <p>Upload cohorts · validation status now</p>
        </div>
        <div className="period-selector" role="group" aria-label="Trend period">
          {[7, 30, 90].map((period) => (
            <button key={period} aria-pressed={days === period} onClick={() => setDays(period)}>
              {period}D
            </button>
          ))}
        </div>
      </div>
      <div className="overview-chart-legend">
        <span>
          <i className="uploaded-dot" />
          Uploaded
        </span>
        <span>
          <i className="validated-dot" />
          Validated now
        </span>
      </div>
      <div className="trend-plot">
        <svg
          viewBox="0 0 580 210"
          role="img"
          aria-label={`Invoice activity over the last ${days} days. ${buckets.reduce((sum, bucket) => sum + bucket.uploaded, 0)} uploads and ${buckets.reduce((sum, bucket) => sum + bucket.validated, 0)} currently validated invoices, grouped by upload date.`}
        >
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1="40"
                x2="560"
                y1={170 - tick * 37}
                y2={170 - tick * 37}
                className="chart-gridline"
              />
              <text x="29" y={174 - tick * 37} textAnchor="end">
                {(ceiling * tick) / 4}
              </text>
            </g>
          ))}
          {buckets.map((bucket, index) => (
            <g key={bucket.date}>
              <title>
                {formatDate(bucket.date)}
                {bucketSize > 1 ? ` (${bucketSize}-day group)` : ''}: {bucket.uploaded} uploaded,{' '}
                {bucket.validated} currently validated
              </title>
              <rect
                x={40 + index * width + width * 0.16}
                y={170 - (bucket.uploaded / ceiling) * 148}
                width={width * 0.29}
                height={(bucket.uploaded / ceiling) * 148}
                rx="1"
                className="uploaded-bar"
              />
              <rect
                x={40 + index * width + width * 0.51}
                y={170 - (bucket.validated / ceiling) * 148}
                width={width * 0.29}
                height={(bucket.validated / ceiling) * 148}
                rx="1"
                className="validated-bar"
              />
              {(index % Math.ceil(buckets.length / 5) === 0 || index === buckets.length - 1) && (
                <text x={40 + (index + 0.5) * width} y="195" textAnchor="middle">
                  {formatDate(bucket.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
        {!hasActivity && <p className="trend-empty">No activity in this period</p>}
      </div>
      <p className="chart-caption">
        {bucketSize === 1 ? 'Daily totals' : `${bucketSize}-day totals`} · Upload dates in UTC.
        Validated shows current status, not historical validation dates.
      </p>
    </section>
  );
}

const statusColors: Record<Status, string> = {
  INTEGRATED: 'var(--status-success-strong)',
  VALIDATED: 'var(--status-success-mid)',
  APPROVED: 'var(--donut-slice-image)',
  REVIEW_REQUIRED: 'var(--status-warning-strong)',
  INTEGRATION_FAILED: 'var(--status-error-strong)',
  UPLOADED: 'var(--donut-slice-other)',
  EXTRACTED: 'var(--donut-slice-excel)',
  EXTRACTING: 'var(--chart-series-b)',
  INTEGRATING: 'var(--chart-series-a)',
};
export function InvoiceStatusDistribution({ invoices }: { invoices: Invoice[] }) {
  const types = invoiceStatusDistribution(invoices).map((entry) => ({
    ...entry,
    label: human(entry.status),
  }));
  let offset = 0;
  return (
    <section className="panel document-types" aria-labelledby="document-types-title">
      <div className="panel-header">
        <div>
          <h2 id="document-types-title">Invoice Status Distribution</h2>
          <p>Current workflow states</p>
        </div>
      </div>
      {invoices.length ? (
        <div className="donut-content">
          <svg
            viewBox="0 0 160 160"
            role="img"
            aria-label={`${invoices.length} invoices: ${types.map((type) => `${type.count} ${type.label}`).join(', ')}`}
          >
            <circle cx="80" cy="80" r="61" fill="none" stroke="#edf2f3" strokeWidth="17" />
            {types.map((type) => {
              const percentage = (type.count / invoices.length) * 100;
              const start = offset;
              offset += percentage;
              return (
                <circle
                  key={type.label}
                  cx="80"
                  cy="80"
                  r="61"
                  pathLength="100"
                  fill="none"
                  stroke={statusColors[type.status]}
                  strokeWidth="17"
                  strokeDasharray={`${percentage} ${100 - percentage}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 80 80)"
                />
              );
            })}
            <text x="80" y="79" textAnchor="middle" className="donut-total">
              {invoices.length}
            </text>
            <text x="80" y="99" textAnchor="middle" className="donut-label">
              invoices
            </text>
          </svg>
          <ul className="donut-legend">
            {types.map((type) => (
              <li key={type.label}>
                <i style={{ background: statusColors[type.status] }} />
                <span>{type.label}</span>
                <strong>{Math.round((type.count / invoices.length) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title="No invoices yet"
          description="Invoice states will appear here as documents are processed."
        />
      )}
      <p className="chart-caption">Based on current invoice statuses.</p>
    </section>
  );
}
