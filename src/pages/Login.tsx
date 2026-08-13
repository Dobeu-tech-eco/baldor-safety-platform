import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { trackEvent } from '../lib/analytics';

const LOGIN_ERROR_ID = 'login-error';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await signIn(email, password);
      if (r.error) throw new Error(r.error);
      trackEvent('login_success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  const errorDescribedBy = error ? LOGIN_ERROR_ID : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#0f1419] to-[#1a2b1f] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-[#006838] flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight">BALDOR</div>
              <div className="text-[#8DC63F] text-xs tracking-widest uppercase">Safety Insights</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500 mb-6">Transportation Safety — Internal access only</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={errorDescribedBy}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-invalid={Boolean(error)}
                  aria-describedby={errorDescribedBy}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]"
                />
              </div>
              {error && (
                <div id={LOGIN_ERROR_ID} role="alert" className="text-sm text-[#C0392B] bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-2.5 bg-[#006838] text-white font-semibold rounded-md hover:bg-[#00532d] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <footer className="text-gray-500 text-[11px] py-3 text-center tracking-widest uppercase">
        Confidential — Internal Use Only
      </footer>
    </div>
  );
}
