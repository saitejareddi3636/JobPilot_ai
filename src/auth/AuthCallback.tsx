import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from './supabase';

// This page handles the redirect back from Google after OAuth.
// Supabase exchanges the code for a session automatically; we just wait and redirect.
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No Supabase config (demo mode) — go straight to dashboard
    if (!supabase) {
      navigate('/', { replace: true });
      return;
    }

    // The Supabase SDK reads the ?code= param from the URL and exchanges it for a session.
    // onAuthStateChange fires with SIGNED_IN once the exchange completes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    // Also handle the case where the session is already established by the time we mount
    void supabase.auth.getSession().then(({ data, error: sessionErr }) => {
      if (sessionErr) { setError(sessionErr.message); return; }
      if (data.session) { navigate('/', { replace: true }); }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-red-200 shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Sign-in failed</h2>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Back to sign-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 size={28} className="text-violet-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Signing you in…</p>
    </div>
  );
}
