import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import { useAuth } from './useAuth';

// Official Google "G" logo — no external image dependency
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { signInWithGoogle, signInWithPassword, signUp } = useAuth();

  const defaultMode: Mode = location.pathname === '/register' ? 'signup' : 'signin';
  const [mode, setMode]       = useState<Mode>(defaultMode);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]       = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogle() {
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // With real Supabase: page redirects to Google. In demo mode: redirect to dashboard.
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleBusy(false);
    }
  }

  async function handleEmailForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password);
        toast.success('Signed in');
      } else {
        await signUp(email.trim(), password);
        toast.success('Account created — check your email to confirm');
      }
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.12),_transparent_60%)] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              JobPilot<span className="text-violet-600"> AI</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your free account'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

          {/* Google button — primary CTA */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleBusy || busy}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all disabled:opacity-60 shadow-sm"
          >
            {googleBusy
              ? <Loader2 size={18} className="animate-spin text-slate-400" />
              : <GoogleLogo />}
            <span>{googleBusy ? 'Redirecting…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmailForm} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-shadow"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</span>
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-shadow"
              />
            </label>

            <button
              type="submit"
              disabled={busy || googleBusy}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signin' ? (busy ? 'Signing in…' : 'Sign in') : (busy ? 'Creating account…' : 'Create account')}
            </button>
          </form>
        </div>

        {/* Toggle sign-in / sign-up */}
        <p className="text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-violet-600 font-semibold hover:underline">
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-violet-600 font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-center text-[11px] text-slate-400">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
