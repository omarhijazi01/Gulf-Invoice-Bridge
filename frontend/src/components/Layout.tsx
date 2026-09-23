import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ArrowUpRight,
  Blocks,
  FileText,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plug,
  ScrollText,
  Settings2,
  X,
  Search,
} from 'lucide-react';
import { backendUrl } from '../services/api';
import { WorkspaceSearch } from './WorkspaceSearch';
import { ProcessInvoice } from './ProcessInvoice';
import { auth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const links = [
  ['/app', 'Overview', LayoutDashboard],
  ['/invoices', 'Invoices', FileText],
  ['/review', 'Review Queue', ListChecks],
  ['/integrations', 'Integrations', Plug],
  ['/logs', 'Activity Logs', ScrollText],
  ['/settings', 'Settings', Settings2],
] as const;

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavLink to="/app" className="brand" onClick={onNavigate}>
      <span className="brand-symbol">
        <Blocks size={25} aria-hidden="true" />
      </span>
      <span>Gulf Invoice Bridge</span>
    </NavLink>
  );
}

function Navigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
      {links.map(([path, label, Icon]) => (
        <NavLink key={path} to={path} end={path === '/app'} onClick={onNavigate}>
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainer = useRef<HTMLDivElement>(null);
  const searchToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (searchOpen) searchContainer.current?.querySelector('input')?.focus();
  }, [searchOpen]);
  const drawer = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  function closeMenu() {
    drawer.current?.close();
    setMenuOpen(false);
  }
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1025px)');
    const closeOnDesktop = () => {
      if (desktop.matches) closeMenu();
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <Navigation />
        <a className="developer-link" href={backendUrl('/docs')} target="_blank" rel="noreferrer">
          <FileText size={16} /> API documentation <ArrowUpRight size={14} />
        </a>
        <button
          className="developer-link"
          type="button"
          onClick={async () => {
            await auth?.auth.signOut();
            navigate('/');
          }}
        >
          Sign out
        </button>
      </aside>
      <dialog
        ref={drawer}
        id="mobile-navigation"
        className="nav-drawer"
        aria-label="Navigation menu"
        onClose={() => setMenuOpen(false)}
        onCancel={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === drawer.current) closeMenu();
        }}
      >
        <div className="drawer-content">
          <div className="drawer-heading">
            <Brand onNavigate={closeMenu} />
            <button className="icon-button" aria-label="Close navigation" onClick={closeMenu}>
              <X size={20} />
            </button>
          </div>
          <Navigation mobile onNavigate={closeMenu} />
          <a className="developer-link" href={backendUrl('/docs')} target="_blank" rel="noreferrer">
            API documentation <ArrowUpRight size={14} />
          </a>
        </div>
      </dialog>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              drawer.current?.showModal();
              setMenuOpen(true);
            }}
          >
            <Menu size={21} />
          </button>
          <div className="mobile-brand">
            <Brand />
          </div>
          <div
            ref={searchContainer}
            id="header-search"
            className={`header-search ${searchOpen ? 'is-open' : ''}`}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && searchOpen) {
                setSearchOpen(false);
                searchToggle.current?.focus();
              }
            }}
          >
            <WorkspaceSearch />
          </div>
          <button
            ref={searchToggle}
            className="icon-button mobile-search-toggle"
            aria-label="Toggle invoice search"
            aria-expanded={searchOpen}
            aria-controls="header-search"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search size={20} />
          </button>
        </header>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer>
          <span>Gulf Invoice Bridge</span>
          <span>Extract. Validate. Review. Approve. Integrate.</span>
        </footer>
      </div>
      <nav className="bottom-navigation" aria-label="Mobile shortcuts">
        <NavLink to="/app" end>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/invoices">
          <FileText size={20} />
          <span>Invoices</span>
        </NavLink>
        <ProcessInvoice label="Upload" />
        <NavLink to="/review">
          <ListChecks size={20} />
          <span>Review</span>
        </NavLink>
        <button
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            drawer.current?.showModal();
            setMenuOpen(true);
          }}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
