import { useState } from 'react';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { ErrorState, LoadingState, PageHeader } from '../components/Common';
import { IntegrationLogTable } from '../components/IntegrationLogTable';
export function Logs() {
  const { data, error, loading, reload } = useResource(api.logs);
  const [filter, setFilter] = useState('ALL');
  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="A persistent record of every request to the ERP simulator."
      >
        <button className="button secondary" onClick={reload}>
          Refresh logs
        </button>
      </PageHeader>
      <section className="panel">
        <div className="filters">
          {['ALL', 'SUCCESS', 'FAILED', 'WARNING'].map((value) => (
            <button
              className={`filter-button ${filter === value ? 'selected' : ''}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              key={value}
            >
              {value === 'ALL'
                ? 'All attempts'
                : value === 'WARNING'
                  ? 'Warnings'
                  : value === 'FAILED'
                    ? 'Failed'
                    : 'Success'}
            </button>
          ))}
          <span className="muted">
            Warnings include timeouts, transport errors and pending attempts.
          </span>
        </div>
        {error ? (
          <ErrorState message={error} retry={reload} />
        ) : loading ? (
          <LoadingState />
        ) : (
          <IntegrationLogTable
            logs={(data ?? []).filter(
              (l) =>
                filter === 'ALL' ||
                (filter === 'WARNING'
                  ? l.http_status === null || l.result === 'PENDING'
                  : l.result === filter),
            )}
          />
        )}
      </section>
    </>
  );
}
