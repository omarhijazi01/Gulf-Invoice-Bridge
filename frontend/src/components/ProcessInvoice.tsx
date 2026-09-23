import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileCheck2, FileWarning, Upload, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { ErrorState } from './Common';
import { auth } from '../services/auth';
export function ProcessInvoice({ label = 'Process Invoice' }: { label?: string }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  async function process(scenario?: string, file?: File) {
    setBusy(true);
    setError('');
    try {
      const invoice = file ? await api.upload(file) : await api.sample(scenario!);
      dialog.current?.close();
      setOpen(false);
      navigate(`/invoices/${invoice.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="button primary process-trigger"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        {label === 'Upload' ? <Plus size={20} /> : <Upload size={16} />} <span>{label}</span>
      </button>
      <dialog
        className="intake-dialog"
        ref={dialog}
        onCancel={() => setOpen(false)}
        aria-labelledby={titleId}
      >
        <div className="dialog-heading">
          <div>
            <div className="eyebrow">DOCUMENT INTAKE</div>
            <h2 id={titleId}>Process an invoice</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close"
            disabled={busy}
            onClick={() => {
              dialog.current?.close();
              setOpen(false);
            }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="muted">
          {auth
            ? 'This limited beta uses fictional samples. Private PDF uploads will open when durable storage is ready.'
            : 'Upload a text-based PDF or explore a fictional sample.'}
        </p>
        {open && (
          <>
            <div className="intake-grid">
              <label className="upload-zone">
                <Upload size={22} />
                <strong>Choose your invoice PDF</strong>
                <span>Text-based PDF · Maximum 10 MB · No scanned-image OCR</span>
                <input
                  aria-label="Upload invoice PDF"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy || Boolean(auth)}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void process(undefined, file);
                  }}
                />
              </label>
              <section className="sample-panel">
                <h3>Explore a sample</h3>
                <p className="muted">Fictional documents for the existing review workflow.</p>
                <div className="sample-options">
                  {[
                    [
                      'clean',
                      'Clean Invoice',
                      'Complete invoice, ready for validation.',
                      FileCheck2,
                    ],
                    [
                      'review',
                      'Review Required Sample',
                      'Missing supplier tax number. Ideal for the 60-second walkthrough.',
                      FileWarning,
                    ],
                    [
                      'invalid',
                      'Financial Mismatch',
                      'A total mismatch that deterministic rules catch.',
                      FileWarning,
                    ],
                  ].map(([key, title, description, Icon]) => {
                    const Symbol = Icon as typeof FileCheck2;
                    return (
                      <button
                        key={String(key)}
                        className="sample-option"
                        disabled={busy}
                        onClick={() => process(String(key))}
                      >
                        <Symbol size={21} />
                        <span>
                          <strong>{String(title)}</strong>
                          <small>{String(description)}</small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
        {busy && <p role="status">Uploading document…</p>}
        {error && <ErrorState message={error} />}
        <p className="fineprint">
          Sample documents contain fictional data. Demo extraction uses a deterministic parser, with
          illustrative confidence values.
        </p>
      </dialog>
    </>
  );
}
