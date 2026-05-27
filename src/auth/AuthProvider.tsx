import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const DEMO_TOKEN_KEY = 'jobpilot_demo_token';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function makeDemoUser(email: string): User {
  return {
    id: 'demo-user',
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { full_name: 'Demo User', avatar_url: null },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
}

function getDemoUser(): User | null {
  const token = localStorage.getItem(DEMO_TOKEN_KEY);
  if (!token) return null;
  const email = token.replace('demo-token-', '') || 'demo@jobpilot.ai';
  return makeDemoUser(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No Supabase config → demo mode (works without any backend)
    if (!supabase) {
      setUser(getDemoUser());
      setSession(null);
      setLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async function signInWithGoogle() {
    if (!supabase) {
      // Demo mode: pretend we just came back from Google
      localStorage.setItem(DEMO_TOKEN_KEY, 'demo-token-demo@gmail.com');
      setUser(makeDemoUser('demo@gmail.com'));
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(error.message);
    // Page will redirect — no further action needed here
  }

  // ── Email / Password ──────────────────────────────────────────────────────

  async function signInWithPassword(email: string, password: string) {
    if (!supabase) {
      localStorage.setItem(DEMO_TOKEN_KEY, `demo-token-${email}`);
      setUser(makeDemoUser(email));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signUp(email: string, password: string) {
    if (!supabase) {
      localStorage.setItem(DEMO_TOKEN_KEY, `demo-token-${email}`);
      setUser(makeDemoUser(email));
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    if (!supabase) {
      localStorage.removeItem(DEMO_TOKEN_KEY);
      setUser(null);
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, isAuthenticated: !!user, signInWithGoogle, signInWithPassword, signUp, signOut }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
