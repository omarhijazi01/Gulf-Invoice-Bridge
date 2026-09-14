import { Link } from 'react-router-dom';
import type { IntegrationLog } from '../types';
import { dateTime, EmptyState, StatusBadge } from './Common';
export function IntegrationLogTable({ logs }: { logs: IntegrationLog[] }) {
  if (!logs.length)
    return (
      <EmptyState
        title="No integration attempts"
        description="Approved invoices can be sent to the local ERP simulator."
      />
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time / invoice</th>
            <th>Attempt</th>
            <th>Result</th>
            <th>HTTP</th>
            <th>Duration</th>
            <th>Simulation</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>
                {dateTime(log.timestamp)}
                <small>
                  {log.invoice_id && (
                    <Link to={`/invoices/${log.invoice_id}`}>{log.invoice_id.slice(0, 8)} ↗</Link>
                  )}
                </small>
              </td>
              <td>#{log.attempt_number}</td>
              <td>
                <StatusBadge status={log.result} />
              </td>
              <td className="mono">{log.http_status ?? 'No response'}</td>
              <td className="tabular">{log.duration_ms} ms</td>
              <td>{log.scenario}</td>
              <td className="log-response">
                {log.reference || log.error_message || 'Request pending'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
