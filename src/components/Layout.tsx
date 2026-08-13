import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, Upload, BarChart3, Database, Gauge, Settings, LogOut, LayoutDashboard, Menu, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFocusTrap } from '../hooks/useFocusTrap';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const NAV_ITEMS: { to: string; icon: Icon; label: string }[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/charts', icon: BarChart3, label: 'Charts' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/data', icon: Database, label: 'Data' },
  { to: '/mileage', icon: Gauge, label: 'Mileage' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/charts': 'Charts',
  '/upload': 'Upload',
  '/data': 'Data',
  '/mileage': 'Mileage',
  '/settings': 'Settings',
};

const MD_QUERY = '(min-width: 768px)';

function navClass(isActive: boolean, compact: boolean) {
  const size = compact
    ? 'min-h-11 px-3 text-sm'
    : 'min-h-[52px] px-3 text-base';
  const base = `flex items-center gap-3 rounded-xl ${size} font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime focus-visible:ring-offset-2 focus-visible:ring-offset-baldor-ink`;
  return isActive
    ? `${base} bg-white/10 text-baldor-lime border-baldor-lime/20`
    : `${base} text-gray-300 hover:text-white hover:bg-white/5 border-transparent`;
}

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`${box} rounded-lg bg-baldor-primary flex items-center justify-center shrink-0`}>
        <Shield className={`${icon} text-white`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold tracking-widest uppercase text-white leading-none">Baldor</div>
        <div className="text-[10px] uppercase tracking-widest text-baldor-lime leading-none mt-0.5">Safety Insights</div>
      </div>
    </div>
  );
}

function NavList({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) => navClass(isActive, compact)}
        >
          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function UserBlock({ compact, onSignOut }: { compact: boolean; onSignOut: () => void }) {
  const { profile } = useAuth();
  const initial = (profile?.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-300 truncate">{profile?.email}</div>
          {profile?.is_admin && <span className="si-chip mt-1">Admin</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className={`w-full flex items-center gap-2 rounded-xl px-3 text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime focus-visible:ring-offset-2 focus-visible:ring-offset-baldor-ink ${compact ? 'min-h-11 text-sm' : 'min-h-[52px] text-base'}`}
      >
        <LogOut className="w-5 h-5" aria-hidden="true" />
        Sign out
      </button>
    </div>
  );
}

export default function Layout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(true);
  const mobileOpenRef = useRef(false);
  const focusMainOnCloseRef = useRef(false);
  mobileOpenRef.current = mobileOpen;
  useFocusTrap(mobileOpen, drawerRef, restoreFocusRef);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Safety Insights';

  useEffect(() => {
    if (mobileOpenRef.current) {
      restoreFocusRef.current = false;
      focusMainOnCloseRef.current = true;
    }
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen || !focusMainOnCloseRef.current) return;
    focusMainOnCloseRef.current = false;
    document.getElementById('main-content')?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    const mql = window.matchMedia(MD_QUERY);
    function onChange() {
      if (mql.matches) {
        restoreFocusRef.current = false;
        setMobileOpen(false);
      }
    }
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  function openMenu() {
    restoreFocusRef.current = true;
    setMobileOpen(true);
  }

  function closeMenu() {
    restoreFocusRef.current = true;
    setMobileOpen(false);
  }

  async function handleSignOut() {
    restoreFocusRef.current = false;
    setMobileOpen(false);
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-baldor-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:bg-baldor-primary focus:text-white"
      >
        Skip to content
      </a>

      <div
        className="flex flex-1 min-h-0"
        {...(mobileOpen ? { inert: true } : {})}
      >
        <aside className="hidden md:flex w-60 shrink-0 bg-baldor-ink text-white flex-col">
          <div className="px-4 py-5 border-b border-white/10">
            <Link to="/dashboard" className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime">
              <BrandMark />
            </Link>
          </div>
          <NavList compact />
          <UserBlock compact onSignOut={handleSignOut} />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden sticky top-0 z-40 h-14 bg-baldor-ink text-white border-b border-white/10 flex items-center justify-between px-3">
            <Link to="/dashboard" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime">
              <BrandMark size="sm" />
            </Link>
            <span className="sr-only">{pageTitle}</span>
            <button
              type="button"
              onClick={openMenu}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              className="min-h-touch min-w-touch flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
          </header>

          <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto outline-none">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6"><Outlet /></div>
          </main>
        </div>
      </div>

      <footer
        className="bg-baldor-ink text-gray-400 text-[11px] py-2 text-center tracking-widest uppercase border-t border-white/10"
        {...(mobileOpen ? { inert: true } : {})}
      >
        Confidential — Internal Use Only
      </footer>

      {mobileOpen && (
        <>
          <div
            data-testid="nav-overlay"
            className="md:hidden fixed inset-0 z-50 bg-baldor-ink/80 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeMenu}
          />
          <div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-[min(20rem,100%)] flex flex-col bg-baldor-ink text-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/10">
              <BrandMark />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation menu"
                className="min-h-touch min-w-touch flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-lime"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <NavList compact={false} />
            <UserBlock compact={false} onSignOut={handleSignOut} />
          </div>
        </>
      )}
    </div>
  );
}
