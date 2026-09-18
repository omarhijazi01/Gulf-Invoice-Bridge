import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  CirclePlay,
  FileText,
  ScanLine,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';

function Skyline() {
  return (
    <svg className="landing-skyline" viewBox="0 0 860 660" role="img" aria-label="Abstract modern business skyline">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9e6e2" />
          <stop offset="100%" stopColor="#7ca59e" />
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d4c52" />
          <stop offset="50%" stopColor="#17333a" />
          <stop offset="100%" stopColor="#0d2429" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#97b6b2" stopOpacity=".78" />
          <stop offset="50%" stopColor="#d5e1dd" stopOpacity=".42" />
          <stop offset="100%" stopColor="#6e918e" stopOpacity=".6" />
        </linearGradient>
        <linearGradient id="reflection" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#284d4f" stopOpacity=".62" />
          <stop offset="100%" stopColor="#062125" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="860" height="660" fill="url(#sky)" opacity=".78" />

      <g className="landing-city" transform="translate(60 48)">
        <g opacity=".88">
          <path d="M80 434h72V280l36-36 36 36v154h56V222l24-31 24 31v212h48V330l22-24 22 24v104h44V176l34-55 34 55v258h47V250l26-32 26 32v184h44V286l24-30 24 30v148h55V346l24-20 24 20v88h58v42H80z" fill="url(#tower)" />
          <path d="M164 280h48v154h-48zM292 226h24v208h-24zM487 184h23v250h-23zM590 252h22v182h-22zM700 292h18v142h-18z" fill="url(#glass)" opacity=".82" />
          <path d="M499 121l8-66 8 66z" fill="#162e34" />
          <path d="M304 191l7-47 7 47z" fill="#19363b" />
          <path d="M188 244l7-38 7 38z" fill="#1e3b40" />
        </g>
        <g className="landing-city-windows" fill="#b9cec7" opacity=".35">
          <rect x="96" y="326" width="7" height="14" rx="2" />
          <rect x="112" y="326" width="7" height="14" rx="2" />
          <rect x="96" y="352" width="7" height="14" rx="2" />
          <rect x="112" y="352" width="7" height="14" rx="2" />
          <rect x="535" y="246" width="8" height="16" rx="2" />
          <rect x="551" y="246" width="8" height="16" rx="2" />
          <rect x="535" y="275" width="8" height="16" rx="2" />
          <rect x="551" y="275" width="8" height="16" rx="2" />
          <rect x="640" y="338" width="8" height="13" rx="2" />
          <rect x="656" y="338" width="8" height="13" rx="2" />
        </g>
      </g>

      <path d="M0 525c184-38 294 1 430 26s249 31 430-12v121H0z" fill="#06252a" />
      <path d="M0 535c176-28 298 8 432 30s260 22 428-18v113H0z" fill="url(#reflection)" opacity=".9" />
      <g stroke="#93b0aa" strokeOpacity=".18">
        <path d="M0 574c173-16 285 14 430 21s287 6 430-20" />
        <path d="M0 606c176-12 293 10 430 16s290 1 430-17" />
        <path d="M0 635c164-8 301 5 430 8s292-2 430-13" />
      </g>
    </svg>
  );
}

export function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-orb landing-orb-one" aria-hidden="true" />
        <div className="landing-orb landing-orb-two" aria-hidden="true" />

        <header className="landing-header">
          <Link to="/" className="landing-brand" aria-label="Gulf Invoice Bridge home">
            <span className="landing-brand-mark" aria-hidden="true">
              <Blocks size={26} />
            </span>
            <span>Gulf Invoice Bridge</span>
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
              title="Authentication will be enabled in the next phase"
              aria-label="Sign in — authentication coming in the next phase"
            >
              Sign in
            </button>
            <Link className="landing-get-started landing-get-started-small" to="/app">
              Get started
            </Link>
          </div>
        </header>

        <div className="landing-hero-content">
          <div className="landing-copy">
            <p className="landing-eyebrow">INVOICE INTELLIGENCE · ERP INTEGRATION</p>
            <h1>
              Invoice Intelligence
              <span>for Modern Workflows</span>
            </h1>
            <h2>Extract. Validate. Review. Approve. Integrate.</h2>
            <p className="landing-lead">
              Turn invoice documents into structured, validated and ERP-ready business data through a transparent review workflow.
            </p>

            <div className="landing-cta-row">
              <Link className="landing-primary-cta" to="/app">
                Get started <ArrowRight size={18} />
              </Link>
              <Link className="landing-demo-cta" to="/app">
                <CirclePlay size={19} />
                Watch demo
              </Link>
            </div>
          </div>

          <div className="landing-visual" aria-hidden="true">
            <Skyline />
          </div>
        </div>

        <svg className="landing-ribbon" viewBox="0 0 1400 760" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ribbonFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1b625d" stopOpacity=".74" />
              <stop offset="52%" stopColor="#79aaa0" stopOpacity=".8" />
              <stop offset="100%" stopColor="#d7ebe4" stopOpacity=".9" />
            </linearGradient>
            <linearGradient id="ribbonFill2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d4542" stopOpacity=".42" />
              <stop offset="100%" stopColor="#c1dfd5" stopOpacity=".7" />
            </linearGradient>
          </defs>
          <path d="M-60 560C220 650 352 650 550 562C785 458 923 205 1510 128L1510 330C1006 358 849 536 625 638C401 740 148 760-60 694Z" fill="url(#ribbonFill)" />
          <path d="M-40 522C182 588 360 590 535 506C780 389 873 223 1460 102" fill="none" stroke="#bce0d5" strokeWidth="3" strokeOpacity=".52" />
          <path d="M-70 625C210 688 392 685 589 600C826 498 970 315 1510 252L1510 388C1008 425 879 575 660 671C413 779 153 781-70 716Z" fill="url(#ribbonFill2)" />
        </svg>

        <div className="landing-feature-strip" id="features">
          <article>
            <span className="landing-feature-icon"><FileText size={21} /></span>
            <div><strong>Document intake</strong><small>Text-based PDF and guided samples</small></div>
          </article>
          <article>
            <span className="landing-feature-icon"><ScanLine size={21} /></span>
            <div><strong>Extraction & validation</strong><small>Structured data with deterministic checks</small></div>
          </article>
          <article>
            <span className="landing-feature-icon"><PlugZap size={21} /></span>
            <div><strong>ERP-ready integration</strong><small>Transform, deliver, retry and observe</small></div>
          </article>
        </div>
      </section>

      <section className="landing-detail-section" id="integrations">
        <div className="landing-detail-copy">
          <span>WORKFLOW</span>
          <h2>From document intake to controlled ERP delivery.</h2>
          <p>
            Extraction is one stage in a larger operational system. Rules validate the structured data, humans approve exceptions,
            and integration requests are logged so failures remain visible and retryable.
          </p>
        </div>
        <div className="landing-workflow" aria-label="Invoice processing workflow">
          {['Upload', 'Extract', 'Validate', 'Review', 'Approve', 'Integrate'].map((step, index) => (
            <div key={step} className="landing-workflow-step">
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-about-section" id="about">
        <div>
          <span>ENGINEERING APPROACH</span>
          <h2>Designed for transparent decisions, not hidden automation.</h2>
        </div>
        <p>
          The current live demo uses a deterministic parser for reproducible sample extraction. The extraction boundary remains
          replaceable, while validation, human approval, payload transformation and integration behavior stay explicit and testable.
        </p>
        <Link className="landing-secondary-link" to="/app">
          Explore the live system <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>Gulf Invoice Bridge</span>
        <span><ShieldCheck size={15} /> Transparent workflow · Recoverable integration</span>
      </footer>
    </div>
  );
}
