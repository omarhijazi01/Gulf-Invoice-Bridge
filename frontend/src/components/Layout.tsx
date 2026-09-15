import { backendUrl } from '../services/api';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ArrowUpRight,
  Blocks,
  FileText,
  LayoutDashboard,
  ListChecks,
  Plug,
  ScrollText,
  Settings2,
} from 'lucide-react';
const links = [
  ['/', 'Overview', LayoutDashboard],
  ['/invoices', 'Invoices', FileText],
  ['/review', 'Review queue', ListChecks],
  ['/integrations', 'Integrations', Plug],
  ['/logs', 'Activity logs', ScrollText],
  ['/settings', 'Settings', Settings2],
] as const;
export function Layout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-symbol">
            <Blocks size={24} />
          </span>
          <span>
            Gulf Invoice<span className="brand-sub">BRIDGE</span>
          </span>
        </NavLink>
        <div className="workspace-label">OPERATIONS WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === '/'}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">BUILT FOR THE WORKFLOW</span>
          <p>
            From invoice document
            <br />
            to enterprise data.
          </p>
          <div className="sidebar-line" />
          <small>
            Portfolio prototype
            <br />
            Saudi Arabia & United Arab Emirates
          </small>
        </div>
        <div className="profile">
          <span className="avatar">GB</span>
          <div>
            Local workspace<small>Portfolio environment</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>
            Invoice Intelligence <span className="slash">/</span> Operations
          </span>
          <a href={backendUrl('/docs')} target="_blank" rel="noreferrer">
            API documentation <ArrowUpRight size={14} />
          </a>
        </div>
        <main id="main">
          <Outlet />
        </main>
        <footer>
          Gulf Invoice Bridge{' '}
          <span>Engineering portfolio · No government certification or connection</span>
        </footer>
      </div>
    </div>
  );
}
