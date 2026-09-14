import type { Rule } from '../types';
import { StatusBadge } from './Common';
export function ValidationSummary({ rules }: { rules: Rule[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Validation results</h2>
          <p>Deterministic business rules · independent of extraction confidence</p>
        </div>
      </div>
      {rules.length ? (
        <>
          <div className="validation-counts">
            {(['PASS', 'WARNING', 'ERROR'] as const).map((status) => (
              <span key={status}>
                <strong>{rules.filter((r) => r.status === status).length}</strong>{' '}
                {status === 'PASS' ? 'Passed' : status === 'WARNING' ? 'Warnings' : 'Errors'}
              </span>
            ))}
          </div>
          <div className="rule-list">
            {rules.map((rule) => (
              <div key={rule.rule}>
                <StatusBadge status={rule.status} />
                <span>{rule.message}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="panel-padding muted">Validation has not run on the current values.</p>
      )}
    </section>
  );
}
