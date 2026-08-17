import { Navigate, Outlet } from 'react-router-dom';
import { Shield, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute() {
  const { isAuthenticated, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (profile && !profile.allowlisted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-md bg-[#006838] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Access pending</h1>
            <p className="text-sm text-gray-600 mt-3 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Your account is awaiting approval.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              An administrator must add you to the access list before you can view safety data.
              Signed in as <span className="font-medium">{profile.email}</span>.
            </p>
            <button onClick={signOut}
              className="mt-6 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
              Sign out
            </button>
          </div>
        </div>
        <footer className="text-gray-500 text-[11px] py-3 text-center tracking-widest uppercase">
          Confidential — Internal Use Only
        </footer>
      </div>
    );
  }

  return <Outlet />;
}
