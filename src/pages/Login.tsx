import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'first'>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-ink-brand flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-full bg-lime flex items-center justify-center">
              <Shield className="w-7 h-7 text-ink-brand" aria-hidden="true" />
            </div>
            <div>
              <div className="t-headline text-lime text-3xl leading-none">Baldor</div>
              <div className="t-eyebrow text-cream/70 mt-1">Safety Insights</div>
            </div>
          </div>

          <div className="card-surface p-8">
            <p className="t-eyebrow mb-2">Transportation Safety</p>
            <h1 className="page-title text-[28px]">
              {mode === 'first' ? 'First-time setup' : 'Sign in'}
            </h1>
            <p className="page-sub mb-6">Internal access only</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-ink-muted mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-ink-muted mb-1">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'first' ? 'new-password' : 'current-password'}
                  className="field"
                />
              </div>
              {error && (
                <div role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-sm px-3 py-2">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Working…' : mode === 'first' ? 'Create account & sign in' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'first' ? 'signin' : 'first'); setError(''); }}
                className="text-xs text-ink-muted hover:text-brand underline underline-offset-4 min-h-[44px] px-2"
              >
                {mode === 'first' ? 'Back to sign in' : 'First-time setup (create initial admin)'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-cream/40 text-[11px] py-3 text-center tracking-[0.16em] uppercase">
        Confidential — Internal Use Only
      </footer>
    </div>
  );
}
