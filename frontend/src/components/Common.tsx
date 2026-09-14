import type { ReactNode } from 'react';
import { AlertCircle, Check, Clock3, FileText, LoaderCircle } from 'lucide-react';
export function human(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (v) => v.toUpperCase());
}
export function StatusBadge({ status }: { status: string }) {
  const positive = ['INTEGRATED', 'APPROVED', 'VALIDATED', 'SUCCESS', 'PASS'].includes(status);
  const negative = ['ERROR', 'FAILED', 'INTEGRATION_FAILED'].includes(status);
  return (
    <span
      className={`badge ${positive ? 'positive' : negative ? 'negative' : status === 'REVIEW_REQUIRED' || status === 'WARNING' ? 'warning' : 'neutral'}`}
    >
      {positive ? <Check size={12} /> : negative ? <AlertCircle size={12} /> : <Clock3 size={12} />}{' '}
      {human(status)}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
export function LoadingState() {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" size={24} /> Loading workspace data…
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="state">
      <FileText size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string | number;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export function dateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'No activity yet';
}
export function amount(value: string | null) {
  if (value === null) return '—';
  const [whole, fraction = '00'] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0')}`;
}
