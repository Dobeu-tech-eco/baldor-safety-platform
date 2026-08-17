import { Navigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { isAuthenticated, loading, signIn } = useAuth();

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-md bg-[#006838] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-gray-900">BALDOR</div>
                <div className="text-[10px] uppercase tracking-widest text-[#006838]">Safety Insights</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Sign in with your account to access confidential safety data. New accounts require
              administrator approval.
            </p>
            <button onClick={signIn} disabled={loading}
              className="w-full py-2.5 bg-[#006838] text-white font-semibold rounded-md hover:bg-[#00532d] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              {loading ? 'Loading...' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
      <footer className="text-gray-500 text-[11px] py-3 text-center tracking-widest uppercase">
        Confidential — Internal Use Only
      </footer>
    </div>
  );
}
