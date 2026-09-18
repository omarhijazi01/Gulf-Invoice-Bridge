import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  Github,
  FileText,
  ScanLine,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';

const workflow = ['Upload', 'Extract', 'Validate', 'Review', 'Approve', 'Integrate'];

export function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <header className="landing-header">
          <Link to="/" className="landing-brand" aria-label="Gulf Invoice Bridge home">
            <span className="landing-brand-mark" aria-hidden="true">
              <span /><span /><span /><span />
            </span>
            <strong>Gulf Invoice Bridge</strong>
          </Link>

          <nav className="landing-nav" aria-label="Landing navigation">
            <a href="#features">Features</a>
            <a href="#integrations">Integrations</a>
            <a href="#about">About</a>
          </nav>

          <div className="landing-header-actions">
            <button
              className="landing-sign-in"
              type="button"
              disabled
              aria-disabled="true"
              title="Authentication will be enabled in the next phase"
            >
              Sign in
            </button>
          </div>
        </header>

        <div className="landing-hero-grid">
          <div className="landing-copy">
            <h1 id="landing-title">
              Invoice Intelligence
              <span>&amp; ERP Integration</span>
              <span>for Modern Workflows</span>
            </h1>

            <p className="landing-hero-line">Extract. Validate. Review. Approve. Integrate.</p>

            <p className="landing-lead">
              Turn invoice documents into structured, validated and ERP-ready business data — transparently.
            </p>

            <div className="landing-cta-row">
              <Link className="landing-primary-cta" to="/app">
                Open live demo <ArrowRight size={18} />
              </Link>
              <a
                className="landing-demo-cta"
                href="https://github.com/omarhijazi01/Gulf-Invoice-Bridge"
                target="_blank"
                rel="noreferrer"
              >
                <Github size={19} />
                View GitHub
              </a>
            </div>
          </div>

          <div className="landing-visual" aria-hidden="true">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/90/Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg" alt="" />
          </div>
        </div>

        <svg className="landing-ribbon" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="landingRibbonA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d5f59" stopOpacity=".12" />
              <stop offset="48%" stopColor="#2b766d" stopOpacity=".74" />
              <stop offset="100%" stopColor="#cfece2" stopOpacity=".96" />
            </linearGradient>
            <linearGradient id="landingRibbonB" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0b4f4b" stopOpacity=".32" />
              <stop offset="100%" stopColor="#a9d7c9" stopOpacity=".70" />
            </linearGradient>
          </defs>
          <path d="M-120 690C155 775 355 777 568 670C830 538 952 260 1540 170L1540 360C1020 390 890 590 635 720C382 849 137 865-120 785Z" fill="url(#landingRibbonA)" />
          <path d="M-110 635C175 705 354 698 555 595C792 474 914 297 1510 164" fill="none" stroke="#d9f1e8" strokeWidth="3" strokeOpacity=".46" />
          <path d="M-100 755C145 822 388 824 610 730C850 628 1020 436 1540 340L1540 490C1050 525 907 670 668 770C417 875 146 888-100 827Z" fill="url(#landingRibbonB)" />
        </svg>

        <div className="landing-feature-strip" id="features">
          <article>
            <span className="landing-feature-icon"><FileText size={21} /></span>
            <div><strong>Document intake</strong><small>Text-based PDF and guided samples</small></div>
          </article>
          <article>
            <span className="landing-feature-icon"><ScanLine size={21} /></span>
            <div><strong>Extraction &amp; validation</strong><small>Structured data with deterministic checks</small></div>
          </article>
          <article>
            <span className="landing-feature-icon"><PlugZap size={21} /></span>
            <div><strong>ERP-ready integration</strong><small>Transform, deliver, retry and observe</small></div>
          </article>
        </div>
      </section>

      <section className="landing-section landing-workflow-section" id="integrations">
        <div className="landing-section-heading">
          <span>WORKFLOW</span>
          <h2>From invoice intake to controlled ERP delivery.</h2>
          <p>
            The workflow keeps extraction, rules, human review and integration as explicit stages so every decision remains visible.
          </p>
        </div>
        <div className="landing-workflow">
          {workflow.map((step, index) => (
            <article key={step}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-about-section" id="about">
        <div>
          <span>ENGINEERING APPROACH</span>
          <h2>Transparent decisions. Recoverable integration.</h2>
        </div>
        <div>
          <p>
            The current live demo uses a deterministic parser for reproducible sample extraction. The extraction boundary remains
            replaceable, while validation, human approval, payload transformation and integration behavior stay explicit and testable.
          </p>
          <div className="landing-principle">
            <span><Blocks size={18} /> Modular processing stages</span>
            <span><ShieldCheck size={18} /> Human approval before integration</span>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Gulf Invoice Bridge</span>
        <span>Invoice intelligence · Validation · Human review · ERP integration</span>
        <small className="landing-image-credit">
          Dubai skyline photo: Imran Shahabuddin · CC BY 2.0
        </small>
      </footer>
    </div>
  );
}
