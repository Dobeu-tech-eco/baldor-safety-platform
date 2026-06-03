import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, AppUser } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        (async () => { await loadProfile(sess.user); })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(u: User) {
    const { data } = await supabase.from('app_users').select('*').eq('id', u.id).maybeSingle();
    if (!data) {
      const { count } = await supabase.from('app_users').select('id', { count: 'exact', head: true });
      const isFirst = (count ?? 0) === 0;
      const { data: created } = await supabase.from('app_users').insert({ id: u.id, email: u.email ?? '', is_admin: isFirst }).select().maybeSingle();
      setProfile(created);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
