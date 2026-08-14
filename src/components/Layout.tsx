import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Upload, BarChart3, Database, Gauge, Settings, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/charts', label: 'Charts', icon: BarChart3 },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/data', label: 'Data', icon: Database },
  { to: '/mileage', label: 'Mileage', icon: Gauge },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    requestAnimationFrame(() => openBtnRef.current?.focus());
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors duration-150 ease-out ${
      isActive
        ? 'bg-lime/15 text-lime border border-lime/30'
        : 'text-cream/70 hover:bg-white/5 hover:text-cream border border-transparent'
    }`;

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav aria-label="Primary" className="flex-1 px-2 py-4 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={navLinkClass}
            onClick={onNavigate}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="t-button">{item.label}</span>
                {isActive && <span className="sr-only">(current page)</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const Brand = () => (
    <Link to="/" className="flex items-center gap-3 min-h-[44px]">
      <div className="w-10 h-10 rounded-full bg-lime flex items-center justify-center shrink-0">
        <Shield className="w-5 h-5 text-ink-brand" aria-hidden="true" />
      </div>
      <div>
        <div className="t-headline text-lime text-lg leading-none">Baldor</div>
        <div className="t-eyebrow text-cream/70 mt-1">Safety Insights</div>
      </div>
    </Link>
  );

  const UserBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={`border-t border-white/10 ${compact ? 'p-4' : 'p-3'}`}>
      <div className="flex items-center gap-3 px-1 mb-3">
        <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center text-cream text-sm font-bold shrink-0">
          {(profile?.email ?? '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm text-cream/90 truncate">{profile?.email}</div>
          {profile?.is_admin && <span className="chip-admin mt-1">Admin</span>}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-2 px-3 min-h-[44px] text-sm text-cream/70 hover:text-danger hover:bg-white/5 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-lime focus:text-ink-true focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex w-60 bg-ink-brand text-cream flex-col shrink-0">
          <div className="px-4 py-5 border-b border-white/10">
            <Brand />
          </div>
          <NavItems />
          <UserBlock />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden sticky top-0 z-40 h-14 bg-ink-brand text-cream flex items-center justify-between px-4 border-b border-white/10">
            <Brand />
            <button
              ref={openBtnRef}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-cream/80 hover:bg-white/10"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

          {menuOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <button
                type="button"
                className="absolute inset-0 bg-ink-brand/80"
                aria-label="Close navigation overlay"
                onClick={closeMenu}
              />
              <div
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                className="absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-ink-brand text-cream flex flex-col shadow-lift"
              >
                <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
                  <Brand />
                  <button
                    ref={closeBtnRef}
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={closeMenu}
                    className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <NavItems onNavigate={closeMenu} />
                <UserBlock compact />
              </div>
            </div>
          )}

          <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto outline-none">
            <div className="max-w-[1400px] mx-auto p-5 md:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <footer className="bg-cream text-ink-muted text-[11px] py-2.5 text-center tracking-[0.16em] uppercase border-t border-hair">
        Confidential — Internal Use Only
      </footer>
    </div>
  );
}
