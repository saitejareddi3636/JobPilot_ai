import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Zap, CheckCircle2, AlertCircle, Loader2, Settings, ChevronRight, User } from 'lucide-react';
import '../src/index.css';

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  workAuthorization: string;
  yearsExperience: number;
}

const EMPTY: Profile = {
  name: '', email: '', phone: '', location: '',
  linkedin: '', github: '', portfolio: '',
  workAuthorization: '', yearsExperience: 0,
};

type View = 'main' | 'setup';

function App() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [view, setView]         = useState<View>('main');
  const [form, setForm]         = useState<Profile>(EMPTY);
  const [status, setStatus]     = useState<'idle' | 'filling' | 'done' | 'error'>('idle');
  const [result, setResult]     = useState<{ filled: number } | null>(null);
  const [fieldCount, setFieldCount] = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    chrome.storage.local.get('jobpilot_profile', ({ jobpilot_profile }) => {
      if (jobpilot_profile) {
        setProfile(jobpilot_profile as Profile);
        setForm(jobpilot_profile as Profile);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'DETECT_FIELDS' }, res => {
        if (chrome.runtime.lastError) return;
        setFieldCount((res as { count: number })?.count ?? 0);
      });
    });
  }, [profile]);

  function saveProfile() {
    chrome.storage.local.set({ jobpilot_profile: form }, () => {
      setProfile(form);
      setView('main');
    });
  }

  function handleFill() {
    setStatus('filling');
    setResult(null);
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id;
      if (!tabId) { setStatus('error'); return; }
      chrome.tabs.sendMessage(tabId, { type: 'FILL_FORM' }, res => {
        if (chrome.runtime.lastError || !res?.ok) { setStatus('error'); return; }
        setResult({ filled: res.filled as number });
        setStatus('done');
      });
    });
  }

  if (loading) {
    return (
      <div className="w-80 h-40 flex items-center justify-center bg-white">
        <Loader2 size={22} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (view === 'setup') {
    return <SetupView form={form} setForm={setForm} onSave={saveProfile} onBack={() => setView('main')} />;
  }

  if (!profile || !profile.name) {
    return <WelcomeView onSetup={() => setView('setup')} />;
  }

  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="w-80 bg-white font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">JobPilot AI</span>
        </div>
        <button
          onClick={() => setView('setup')}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          title="Edit profile"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Profile pill */}
      <div className="mx-4 mt-3 flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{profile.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
        </div>
        {fieldCount !== null && fieldCount > 0 && (
          <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
            {fieldCount} fields
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {status === 'idle' && (
          <>
            {fieldCount === 0 && (
              <p className="text-xs text-center text-slate-400 py-1">
                No fillable fields detected on this page.
              </p>
            )}
            <button
              onClick={handleFill}
              disabled={fieldCount === 0}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={15} />
              Fill this page
            </button>
          </>
        )}

        {status === 'filling' && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-violet-500" />
            Filling fields…
          </div>
        )}

        {status === 'done' && result && (
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {result.filled} field{result.filled !== 1 ? 's' : ''} filled
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Review everything carefully before submitting.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setStatus('idle'); setResult(null); }}
              className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Fill again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                Could not fill this page. Make sure you are on a job application form.
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-1 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          JobPilot never submits automatically — always review before submitting
        </p>
      </div>
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

function WelcomeView({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="w-80 bg-white font-sans">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
          <Zap size={13} className="text-white" />
        </div>
        <span className="font-bold text-slate-800 text-sm">JobPilot AI</span>
      </div>
      <div className="px-5 py-6 space-y-4 text-center">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
          <User size={26} className="text-violet-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Set up your profile</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Enter your details once. JobPilot will use them to fill job application forms on any site automatically.
          </p>
        </div>
        <button
          onClick={onSetup}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
        >
          Set up profile
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Setup / edit ─────────────────────────────────────────────────────────────

function SetupView({
  form, setForm, onSave, onBack,
}: {
  form: Profile;
  setForm: (p: Profile) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  function f(key: keyof Profile, label: string, placeholder: string, type = 'text') {
    return (
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </label>
        <input
          type={type}
          value={form[key] as string}
          onChange={e => setForm({
            ...form,
            [key]: key === 'yearsExperience' ? Number(e.target.value) : e.target.value,
          })}
          placeholder={placeholder}
          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white font-sans">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none mr-1"
        >
          ←
        </button>
        <span className="font-bold text-slate-800 text-sm">Your Profile</span>
      </div>
      <div className="px-4 py-3 space-y-2.5 max-h-[420px] overflow-y-auto">
        {f('name',              'Full name',           'Alex Rivera')}
        {f('email',             'Email',               'alex@email.com', 'email')}
        {f('phone',             'Phone',               '+1 (555) 000-0000', 'tel')}
        {f('location',          'City / Location',     'San Francisco, CA')}
        {f('linkedin',          'LinkedIn URL',        'linkedin.com/in/yourname')}
        {f('github',            'GitHub URL',          'github.com/yourname')}
        {f('portfolio',         'Portfolio / Website', 'yoursite.com')}
        {f('workAuthorization', 'Work authorization',  'US Citizen / H1B / OPT')}
        {f('yearsExperience',   'Years of experience', '3', 'number')}
      </div>
      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <button
          onClick={onSave}
          disabled={!form.name || !form.email}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={14} />
          Save profile
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
