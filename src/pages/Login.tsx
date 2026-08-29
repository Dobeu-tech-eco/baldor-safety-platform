import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { isCloudConfigured, supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'first'>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const cloudReady = isCloudConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'first') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
      } else {
        const r = await signIn(email, password);
        if (r.error) throw new Error(r.error);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{mode === 'first' ? 'First-time setup' : 'Sign in'}</h1>
            <p className="text-sm text-gray-500 mb-6">Transportation Safety — Internal access only</p>

            {!cloudReady && (
              <div className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Lovable database is not connected.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]" />
              </div>
              {error && <div className="text-sm text-[#C0392B] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#006838] text-white font-semibold rounded-md hover:bg-[#00532d] disabled:opacity-50 transition-colors">
                {loading ? 'Working...' : mode === 'first' ? 'Create account & sign in' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => { setMode(mode === 'first' ? 'signin' : 'first'); setError(''); }}
                className="text-xs text-gray-600 hover:text-[#006838] underline">
                {mode === 'first' ? 'Back to sign in' : 'First-time setup (create initial admin)'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-gray-500 text-[11px] py-3 text-center tracking-widest uppercase">
        Confidential — Internal Use Only
      </footer>
    </div>
  );
}
