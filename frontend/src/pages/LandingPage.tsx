import { ArrowRight, Braces, CheckCircle2, Database, FileCheck2, FileText, GitBranch, Layers3, LockKeyhole, PlugZap, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const workflow = [
  ['01', 'Upload', 'Bring an invoice document into the workflow.'],
  ['02', 'Extract', 'Convert document content into structured invoice fields.'],
  ['03', 'Validate', 'Run deterministic financial and business rules.'],
  ['04', 'Review', 'Keep uncertain or invalid data in a human review loop.'],
  ['05', 'Approve', 'Lock a validated record before downstream delivery.'],
  ['06', 'Integrate', 'Transform and deliver ERP-ready payloads over APIs.'],
];

const features = [
  {
    icon: FileCheck2,
    eyebrow: 'CONTROLLED PROCESSING',
    title: 'Document to structured data',
    text: 'Keep extraction separate from business validation so the workflow stays transparent, testable and replaceable.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'DETERMINISTIC RULES',
    title: 'Validation before automation',
    text: 'Financial checks and required-field rules stay explicit instead of being delegated to an AI model.',
  },
  {
    icon: PlugZap,
    eyebrow: 'API-FIRST DELIVERY',
    title: 'ERP integration layer',
    text: 'Approved invoices are transformed into a stable payload and delivered through a recoverable connector workflow.',
  },
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="Gulf Invoice Bridge home">
          <span className="landing-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <strong>Gulf Invoice Bridge</strong>
        </Link>

        <nav className="landing-nav" aria-label="Landing page navigation">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#architecture">Architecture</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-header-actions">
          <button
            className="landing-signin"
            type="button"
            aria-disabled="true"
            title="Authentication is the next implementation phase"
          >
            <LockKeyhole size={16} />
            Sign in
          </button>
          <Link className="landing-primary landing-primary-small" to="/app">
            Open live demo
            <ArrowRight size={17} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-ambient landing-ambient-one" />
          <div className="landing-ambient landing-ambient-two" />
          <div className="landing-wave landing-wave-one" />
          <div className="landing-wave landing-wave-two" />

          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <Sparkles size={15} />
              INVOICE INTELLIGENCE · VALIDATION · ERP INTEGRATION
            </div>
            <h1>
              Invoice intelligence
              <span> for modern operations.</span>
            </h1>
            <p className="landing-hero-line">Extract. Validate. Review. Approve. Integrate.</p>
            <p className="landing-hero-description">
              Turn invoice documents into structured, validated, human-reviewed and ERP-ready data through a transparent workflow built for operational control.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-primary" to="/app">
                Open live demo
                <ArrowRight size={19} />
              </Link>
              <a
                className="landing-secondary"
                href="https://github.com/omarhijazi01/Gulf-Invoice-Bridge"
                target="_blank"
                rel="noreferrer"
              >
                View GitHub
                <GitBranch size={18} />
              </a>
            </div>
            <p className="landing-hero-note">
              Current deployed extraction uses a deterministic demo parser. The extraction layer is designed to remain replaceable for AI providers.
            </p>
          </div>

          <div className="landing-system-visual" aria-label="Invoice workflow visualization">
            <div className="landing-visual-grid" />
            <div className="landing-floating-card landing-document-card">
              <div className="landing-card-label">
                <FileText size={15} />
                SOURCE DOCUMENT
              </div>
              <div className="landing-invoice-lines">
                <span className="wide" />
                <span />
                <span className="medium" />
                <span />
              </div>
              <div className="landing-document-total">
                <small>TOTAL</small>
                <strong>1,150.00</strong>
              </div>
            </div>

            <div className="landing-flow-line landing-flow-line-one" />
            <div className="landing-flow-line landing-flow-line-two" />

            <div className="landing-floating-card landing-validation-card">
              <div className="landing-card-label">
                <CheckCircle2 size={15} />
                VALIDATION
              </div>
              <strong>Rules passed</strong>
              <div className="landing-status-row">
                <span>Totals reconcile</span>
                <b>PASS</b>
              </div>
              <div className="landing-status-row">
                <span>Required fields</span>
                <b>PASS</b>
              </div>
              <div className="landing-status-row">
                <span>Human review</span>
                <b className="review">READY</b>
              </div>
            </div>

            <div className="landing-floating-card landing-erp-card">
              <div className="landing-card-label">
                <Braces size={15} />
                ERP PAYLOAD
              </div>
              <code>{'{'} invoice_id, supplier, totals, lines {'}'}</code>
              <div className="landing-erp-footer">
                <Database size={15} />
                REST connector · idempotent delivery
              </div>
            </div>

            <div className="landing-visual-caption">
              <span>01</span>
              <div>
                <strong>Transparent by design</strong>
                <small>AI-ready extraction · deterministic rules · human approval · API delivery</small>
              </div>
            </div>
          </div>

          <div className="landing-capability-strip" aria-label="Key capabilities">
            <div>
              <FileText size={18} />
              <span><strong>Document intake</strong><small>PDF workflow</small></span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span><strong>Validation layer</strong><small>Explicit business rules</small></span>
            </div>
            <div>
              <Layers3 size={18} />
              <span><strong>Human review</strong><small>Controlled approval state</small></span>
            </div>
            <div>
              <PlugZap size={18} />
              <span><strong>ERP integration</strong><small>API-based delivery</small></span>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-heading">
            <span>01 · FEATURES</span>
            <h2>Automation with explicit control points.</h2>
            <p>
              The system is designed around clear boundaries: extraction creates candidate data, rules validate it, people approve it, and APIs move it downstream.
            </p>
          </div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, eyebrow, title, text }) => (
              <article className="landing-feature-card" key={title}>
                <div className="landing-feature-icon"><Icon size={21} /></div>
                <small>{eyebrow}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-workflow-section" id="workflow">
          <div className="landing-section-heading landing-section-heading-light">
            <span>02 · WORKFLOW</span>
            <h2>From invoice document to ERP-ready record.</h2>
            <p>
              Every transition has a purpose. Invalid or uncertain information stays visible instead of disappearing inside a black-box automation flow.
            </p>
          </div>
          <div className="landing-workflow">
            {workflow.map(([index, title, text]) => (
              <article key={title}>
                <small>{index}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="architecture">
          <div className="landing-section-heading">
            <span>03 · ARCHITECTURE</span>
            <h2>One workflow. Clear system boundaries.</h2>
            <p>
              The live portfolio build separates the React product interface, FastAPI invoice service, persistence and ERP simulator so each layer can be inspected independently.
            </p>
          </div>

          <div className="landing-architecture">
            <div className="landing-architecture-track">
              <article>
                <span><Layers3 size={18} /></span>
                <small>PRODUCT UI</small>
                <strong>React frontend</strong>
              </article>
              <i>→</i>
              <article>
                <span><Braces size={18} /></span>
                <small>INVOICE API</small>
                <strong>FastAPI service</strong>
              </article>
              <i>→</i>
              <article>
                <span><Database size={18} /></span>
                <small>PROCESSING</small>
                <strong>Rules + persistence</strong>
              </article>
              <i>→</i>
              <article>
                <span><PlugZap size={18} /></span>
                <small>INTEGRATION</small>
                <strong>ERP connector</strong>
              </article>
              <i>→</i>
              <article>
                <span><Database size={18} /></span>
                <small>DEPENDENCY</small>
                <strong>ERP simulator</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-about-section" id="about">
          <div>
            <span className="landing-about-index">04 · ENGINEERING PRINCIPLE</span>
            <h2>AI is a component of the workflow, not the authority over it.</h2>
          </div>
          <div className="landing-about-copy">
            <p>
              Gulf Invoice Bridge keeps extraction, validation, human approval and integration as separate concerns. That makes failures easier to inspect, retries safer, and future provider changes less disruptive.
            </p>
            <div className="landing-principle">
              <strong>AI extracts.</strong>
              <strong>Rules validate.</strong>
              <strong>Humans approve.</strong>
              <strong>APIs integrate.</strong>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div>
            <span>LIVE PORTFOLIO PRODUCT</span>
            <h2>Explore the operational workflow.</h2>
            <p>Open the live system to inspect invoices, review states, validation, ERP payloads and integration logs.</p>
          </div>
          <Link className="landing-primary landing-primary-light" to="/app">
            Open live demo
            <ArrowRight size={19} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>Gulf Invoice Bridge</strong>
          <span>Invoice Intelligence & Enterprise ERP Integration Platform</span>
        </div>
        <div>
          <a href="https://omarhijazi01.github.io" target="_blank" rel="noreferrer">Portfolio</a>
          <a href="https://github.com/omarhijazi01/Gulf-Invoice-Bridge" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
