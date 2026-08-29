import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Shield, Upload, Gauge, Settings, LogOut, LayoutDashboard, Activity,
  AlertTriangle, HeartPulse, UserPlus, Eye, ClipboardCheck, HelpCircle,
  BookOpen, Landmark,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItem = (to: string, icon: JSX.Element, label: string) => (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          isActive ? 'bg-[#006838] text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}>
      {icon}<span>{label}</span>
    </NavLink>
  );

  async function handleSignOut() { await signOut(); navigate('/login'); }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        <aside className="w-60 bg-[#0f1419] text-white flex flex-col">
          <div className="px-4 py-5 border-b border-gray-800">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-[#006838] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight">BALDOR</div>
                <div className="text-[10px] uppercase tracking-widest text-[#8DC63F]">Safety Insights</div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItem('/dashboard', <LayoutDashboard className="w-4 h-4" />, 'Dashboard')}
            {navItem('/apmm', <Activity className="w-4 h-4" />, 'APMM')}
            {navItem('/incidents', <AlertTriangle className="w-4 h-4" />, 'Incidents')}
            {navItem('/injuries', <HeartPulse className="w-4 h-4" />, 'Injuries')}
            {navItem('/new-hire', <UserPlus className="w-4 h-4" />, 'New-Hire')}
            {navItem('/distracted', <Eye className="w-4 h-4" />, 'Distracted')}
            {navItem('/dot', <ClipboardCheck className="w-4 h-4" />, 'DOT')}
            {navItem('/unclassified', <HelpCircle className="w-4 h-4" />, 'Unclassified')}
            {navItem('/mileage', <Gauge className="w-4 h-4" />, 'Mileage')}
            {navItem('/claims', <Landmark className="w-4 h-4" />, 'Claims')}
            {navItem('/methodology', <BookOpen className="w-4 h-4" />, 'Methodology')}
            {navItem('/settings', <Settings className="w-4 h-4" />, 'Settings')}
            {navItem('/upload', <Upload className="w-4 h-4" />, 'Upload')}
          </nav>
          <div className="border-t border-gray-800 p-3">
            <div className="text-xs text-gray-400 mb-2 px-1">
              {profile?.email}
              {profile?.is_admin && <span className="ml-2 text-[#8DC63F]">Admin</span>}
            </div>
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-6"><Outlet /></div>
        </main>
      </div>
      <footer className="bg-[#0f1419] text-gray-400 text-[11px] py-2 text-center tracking-widest uppercase border-t border-gray-800">
        CONFIDENTIAL — Internal Use Only
      </footer>
    </div>
  );
}
