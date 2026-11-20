// Layout shells. Public pages share the marketing header/footer from the
// template; the customer app and the admin console share one app shell with
// role-specific navigation — same brand, same type, same red header.

import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { Alert } from './ui.jsx';
import LanguageSelect from './LanguageSelect.jsx';

import social1 from '../assets/img/60e480545285521588bab0d1_icon-social-media-01-banca-template.svg';
import social2 from '../assets/img/60e48054528552a715bab0d2_icon-social-media-02-banca-template.svg';
import social3 from '../assets/img/60e480545285526354bab0d4_icon-social-media-03-banca-template.svg';
import social4 from '../assets/img/60e48054528552ae5abab0d3_icon-social-media-04-banca-template.svg';
import brandLogo from '../assets/img/logo.jpeg';

export function Brand({ to = '/', small = true }) {
  return (
    <Link to={to} className="brand">
      <img src={brandLogo} alt="Steinberg Swiss Finance" className="brand-logo" />
    </Link>
  );
}

export function PublicHeader() {
  const { session } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header no-print">
      <div className="container">
        <Brand />
        <button className="menu-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <nav className={`site-nav${menuOpen ? ' open' : ''}`} aria-label="Public">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/rates" onClick={() => setMenuOpen(false)}>Services</NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>About Us</NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</NavLink>
        </nav>
        <div className="header-actions">
          <LanguageSelect />
          {session ? (
            <Link className="btn btn-secondary btn-sm" to={session.role === 'admin' ? '/admin' : '/app'}>
              Go to {session.role === 'admin' ? 'console' : 'banking'}
            </Link>
          ) : (
            <>
              <Link className="btn btn-secondary btn-sm" to="/signin">Sign in</Link>
              <Link className="btn btn-sm" to="/register">Open account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function FlashHost() {
  const { flash, clearFlash } = useStore();
  if (!flash) return null;
  return <Alert type={flash.type} onClose={clearFlash}>{flash.text}</Alert>;
}

export function PublicFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <div className="flex gap-12" style={{ marginTop: 16 }}>
              {[social1, social2, social3, social4].map((s, i) => (
                <img key={i} src={s} alt="" style={{ width: 22, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div>
            <div className="footer-title">Menu</div>
            <ul className="footer-links">
              <li><Link to="/">Home V1</Link></li>
              <li><Link to="/">Home V2</Link></li>
              <li><Link to="/rates">Services</Link></li>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/about">Blog</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Contact us</div>
            <ul className="footer-links">
              <li>support@steinberg.example</li>
              <li>+1 (415) 374-7356</li>
              <li>1550 Bryant Street<br />STE 750, San Francisco, CA 94103</li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Utility pages</div>
            <ul className="footer-links">
              <li><Link to="/">Styleguide</Link></li>
              <li><Link to="/">404 Not Found</Link></li>
              <li><Link to="/">Password protected</Link></li>
              <li><Link to="/">Licenses</Link></li>
              <li><Link to="/">Start Here</Link></li>
              <li><Link to="/">Changelog</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-fine">
        <div className="container">
          © Copyright Steinberg Swiss Finance · Build {typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev'}
        </div>
      </div>
    </footer>
  );
}

const CUSTOMER_NAV = [
  ['/app', 'Dashboard', true],
  ['/app/accounts', 'Accounts'],
  ['/app/transactions', 'Transactions'],
  ['/app/transfer', 'Local transfer'],
  ['/app/deposit', 'Deposit'],
  ['/app/wire', 'International Wire Transfer'],
  ['/app/beneficiaries', 'Beneficiaries'],
  ['/app/cards', 'Cards'],
  ['/app/statements', 'Statements'],
  ['/app/tickets', 'Support tickets'],
  ['/app/profile', 'Profile'],
];

const ADMIN_NAV = [
  ['/admin', 'Dashboard', true],
  ['/admin/users', 'Users'],
  ['/admin/accounts', 'Accounts'],
  ['/admin/deposits', 'Deposits'],
  ['/admin/wire-transfers', 'International Wire Transfers'],
  ['/admin/transactions', 'Transactions'],
  ['/admin/pending-transfers', 'Pending transfers'],
  ['/admin/notices', 'Notices'],
  ['/admin/settings', 'Settings'],
];

export function AppShell({ role }) {
  const { currentUser, signOut, resetData } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const nav = role === 'admin' ? ADMIN_NAV : CUSTOMER_NAV;
  return (
    <>
      <header className="site-header no-print">
        <div className="container">
          <Brand to={role === 'admin' ? '/admin' : '/app'} />
          <div className="header-actions">
            <LanguageSelect />
            <button className="menu-toggle" aria-label="Menu" onClick={() => setNavOpen(!navOpen)}>
              <span /><span /><span />
            </button>
            {currentUser && currentUser.profilePicture && (
              <img src={currentUser.profilePicture} alt="" className="avatar" />
            )}
            <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: 14 }}>
              {currentUser ? `${currentUser.name} · ${role === 'admin' ? 'Admin' : 'Customer'}` : ''}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => { if (window.confirm('Reset all data to the seed state? Your local edits will be lost.')) resetData(); }}>
              Reset data
            </button>
            <button className="btn btn-secondary btn-sm" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <nav className={`sub-nav no-print${navOpen ? ' open' : ''}`} aria-label={role === 'admin' ? 'Admin' : 'Customer'}>
        <div className="container">
          {nav.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={Boolean(end)} onClick={() => setNavOpen(false)}>
              {label}
            </NavLink>
          ))}
          <span className="spacer" />
          <span className="nav-note">
            {role === 'admin' ? 'Admin console' : 'Customer portal'}
          </span>
        </div>
      </nav>
      <main className="app-main">
        <div className="container">
          <FlashHost />
          <Outlet />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

export function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <main>
        <FlashHost />
        <Outlet />
      </main>
      <PublicFooter />
    </>
  );
}

// Role separation: a customer session can never open admin routes and vice
// versa. This mirrors the PHP 'admin' / 'customer' middleware groups.
export function RequireRole({ role }) {
  const { session, notify } = useStore();
  const location = useLocation();
  const denied = session && session.role !== role;

  // Notify in an effect — never setState during render.
  useEffect(() => {
    if (!denied) return;
    notify(
      'error',
      role === 'admin'
        ? 'Access denied: this customer session cannot open admin routes.'
        : 'Access denied: the admin session does not have a customer portal.',
    );
  }, [denied, notify, role]);

  if (!session) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  if (denied) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/app'} replace />;
  }
  return <Outlet />;
}
