import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth as useReplitAuth, type AuthUser as ReplitUser } from '@workspace/replit-auth-web';
import { api, loginUrl, logoutUrl, type AppUser } from './api';

type AuthContextValue = {
  user: ReplitUser | null;
  profile: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useReplitAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await api<AppUser>('/users/me'));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    api<AppUser>('/users/me')
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  function signIn() {
    window.location.href = loginUrl(window.location.pathname || '/');
  }

  async function signOut() {
    window.location.href = logoutUrl();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading: isLoading || profileLoading,
        isAuthenticated,
        signIn,
        signOut,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
