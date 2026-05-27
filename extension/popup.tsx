import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Zap, CheckCircle2, AlertCircle, Loader2, User,
  Link2, Briefcase, ChevronRight, RotateCcw, Sparkles,
} from 'lucide-react';
import '../src/index.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Experience
  currentTitle: string;
  yearsExperience: number;
  workAuthorization: string;
  salaryExpectation: string;
  noticePeriod: string;
  // Links
  linkedin: string;
  github: string;
  portfolio: string;
  twitter: string;
}

const EMPTY: Profile = {
  firstName: '', lastName: '', email: '', phone: '',
  city: '', state: '', zipCode: '', country: 'United States',
  currentTitle: '', yearsExperience: 0, workAuthorization: '',
  salaryExpectation: '', noticePeriod: '',
  linkedin: '', github: '', portfolio: '', twitter: '',
};

type Tab = 'fill' | 'profile' | 'links';

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [draft, setDraft]         = useState<Profile>(EMPTY);
  const [tab, setTab]             = useState<Tab>('fill');
  const [setup, setSetup]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [fillStatus, setFillStatus] = useState<'idle' | 'filling' | 'done' | 'error'>('idle');
  const [fillResult, setFillResult] = useState<{ filled: number } | null>(null);
  const [fieldCount, setFieldCount] = useState<number | null>(null);
  const [savedAt, setSavedAt]     = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved profile + draft on mount
  useEffect(() => {
    chrome.storage.local.get(['jobpilot_profile', 'jobpilot_draft'], (result) => {
      const saved  = result.jobpilot_profile as Profile | undefined;
      const drafty = result.jobpilot_draft   as Profile | undefined;
      if (saved)  setProfile(saved);
      if (drafty) setDraft(drafty);
      else if (saved) setDraft(saved);
      setSetup(!saved);
      setLoading(false);
    });
  }, []);

  // Auto-save draft on every keystroke (debounced 400 ms)
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      chrome.storage.local.set({ jobpilot_draft: draft });
      setSavedAt(Date.now());
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [draft, loading]);

  // Detect fields when profile exists
  useEffect(() => {
    if (!profile) return;
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const id = tabs[0]?.id;
      if (!id) return;
      chrome.tabs.sendMessage(id, { type: 'DETECT_FIELDS' }, res => {
        if (chrome.runtime.lastError) return;
        setFieldCount((res as { count: number })?.count ?? 0);
      });
    });
  }, [profile]);

  function saveProfile() {
    chrome.storage.local.set({ jobpilot_profile: draft, jobpilot_draft: draft }, () => {
      setProfile(draft);
      setSetup(false);
      setTab('fill');
    });
  }

  function handleFill() {
    setFillStatus('filling');
    setFillResult(null);
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const id = tabs[0]?.id;
      if (!id) { setFillStatus('error'); return; }
      chrome.tabs.sendMessage(id, { type: 'FILL_FORM' }, res => {
        if (chrome.runtime.lastError || !res?.ok) { setFillStatus('error'); return; }
        setFillResult({ filled: res.filled as number });
        setFillStatus('done');
        // log to history
        chrome.storage.local.get('jobpilot_history', ({ jobpilot_history }) => {
          const history = (jobpilot_history as Array<{ url: string; filled: number; ts: number }>) ?? [];
          chrome.tabs.query({ active: true, currentWindow: true }, t => {
            history.unshift({ url: t[0]?.url ?? '', filled: res.filled as number, ts: Date.now() });
            chrome.storage.local.set({ jobpilot_history: history.slice(0, 20) });
          });
        });
      });
    });
  }

  if (loading) {
    return (
      <div className="w-[400px] h-48 flex items-center justify-center bg-white">
        <Loader2 size={24} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (setup || !profile) {
    return <SetupWelcome draft={draft} setDraft={setDraft} onSave={saveProfile} savedAt={savedAt} />;
  }

  return (
    <div className="w-[400px] bg-white font-sans flex flex-col" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">JobPilot</span>
            <span className="font-bold text-violet-600 text-sm tracking-tight"> AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1" />
          <span className="text-[11px] text-slate-400 font-medium">Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white">
        {([
          { id: 'fill',    label: 'Fill Form',  icon: Sparkles },
          { id: 'profile', label: 'Profile',    icon: User },
          { id: 'links',   label: 'Links',      icon: Link2 },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === id
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'fill' && (
          <FillTab
            profile={profile}
            fieldCount={fieldCount}
            fillStatus={fillStatus}
            fillResult={fillResult}
            onFill={handleFill}
            onReset={() => { setFillStatus('idle'); setFillResult(null); }}
          />
        )}
        {tab === 'profile' && (
          <ProfileTab draft={draft} setDraft={setDraft} onSave={saveProfile} savedAt={savedAt} />
        )}
        {tab === 'links' && (
          <LinksTab draft={draft} setDraft={setDraft} onSave={saveProfile} savedAt={savedAt} />
        )}
      </div>
    </div>
  );
}

// ─── Fill tab ─────────────────────────────────────────────────────────────────

function FillTab({
  profile, fieldCount, fillStatus, fillResult, onFill, onReset,
}: {
  profile: Profile;
  fieldCount: number | null;
  fillStatus: 'idle' | 'filling' | 'done' | 'error';
  fillResult: { filled: number } | null;
  onFill: () => void;
  onReset: () => void;
}) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = [profile.firstName[0], profile.lastName[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="p-5 space-y-4">
      {/* Profile summary card */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initials || <User size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{fullName || 'Your name'}</p>
          <p className="text-xs text-slate-500 truncate">{profile.email || 'your@email.com'}</p>
        </div>
        {fieldCount !== null && fieldCount > 0 && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-violet-600">{fieldCount}</p>
            <p className="text-[10px] text-slate-400">fields</p>
          </div>
        )}
      </div>

      {/* Field detection status */}
      {fieldCount !== null && (
        <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
          fieldCount > 0
            ? 'bg-violet-50 text-violet-700 border border-violet-100'
            : 'bg-slate-50 text-slate-500 border border-slate-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${fieldCount > 0 ? 'bg-violet-400' : 'bg-slate-300'}`} />
          {fieldCount > 0
            ? `${fieldCount} fillable field${fieldCount !== 1 ? 's' : ''} detected on this page`
            : 'No job application fields detected on this page'}
        </div>
      )}

      {/* Fill button */}
      {fillStatus === 'idle' && (
        <button
          onClick={onFill}
          disabled={fieldCount === 0}
          className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Fill Application
        </button>
      )}

      {fillStatus === 'filling' && (
        <div className="w-full py-3.5 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center gap-2 text-sm font-semibold text-violet-600">
          <Loader2 size={16} className="animate-spin" />
          Filling fields…
        </div>
      )}

      {fillStatus === 'done' && fillResult && (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                {fillResult.filled} field{fillResult.filled !== 1 ? 's' : ''} filled successfully
              </p>
              <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                Fields are highlighted in purple. Review all values carefully before submitting — JobPilot never auto-submits.
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <RotateCcw size={13} />
            Fill again
          </button>
        </div>
      )}

      {fillStatus === 'error' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Could not fill this page</p>
              <p className="text-xs text-red-600 mt-1">Make sure you are on a job application page, then try again.</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* What it fills */}
      {fillStatus === 'idle' && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Will fill</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              'First & last name', 'Email address', 'Phone number', 'City / location',
              'LinkedIn URL', 'GitHub URL', 'Portfolio URL', 'Work authorization',
              'Current job title', 'Years of experience',
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <CheckCircle2 size={10} className="text-violet-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ draft, setDraft, onSave, savedAt }: {
  draft: Profile;
  setDraft: (p: Profile) => void;
  onSave: () => void;
  savedAt: number | null;
}) {
  function f(key: keyof Profile, label: string, placeholder: string, type = 'text') {
    return (
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <input
          type={type}
          value={draft[key] as string}
          onChange={e => setDraft({
            ...draft,
            [key]: key === 'yearsExperience' ? Number(e.target.value) : e.target.value,
          })}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-shadow"
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Personal Info</p>
        {savedAt && (
          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> Auto-saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {f('firstName', 'First name',  'Alex')}
        {f('lastName',  'Last name',   'Rivera')}
      </div>
      {f('email',       'Email',       'alex@email.com', 'email')}
      {f('phone',       'Phone',       '+1 (555) 000-0000', 'tel')}
      <div className="grid grid-cols-2 gap-3">
        {f('city',    'City',   'San Francisco')}
        {f('state',   'State',  'CA')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {f('zipCode', 'ZIP',     '94105')}
        {f('country', 'Country', 'United States')}
      </div>

      <div className="pt-1 border-t border-slate-100" />
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Experience</p>

      {f('currentTitle',     'Current job title',   'Software Engineer')}
      {f('yearsExperience',  'Years of experience', '3', 'number')}
      {f('workAuthorization','Work authorization',   'US Citizen / H1B / OPT')}
      {f('salaryExpectation','Salary expectation',   '$120,000')}
      {f('noticePeriod',     'Notice period',        '2 weeks / Immediate')}

      <button
        onClick={onSave}
        disabled={!draft.firstName || !draft.email}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={14} />
        Save profile
      </button>
    </div>
  );
}

// ─── Links tab ────────────────────────────────────────────────────────────────

function LinksTab({ draft, setDraft, onSave, savedAt }: {
  draft: Profile;
  setDraft: (p: Profile) => void;
  onSave: () => void;
  savedAt: number | null;
}) {
  function f(key: keyof Profile, label: string, placeholder: string, icon: React.ReactNode) {
    return (
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
          <input
            type="url"
            value={draft[key] as string}
            onChange={e => setDraft({ ...draft, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-shadow"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Profile Links</p>
        {savedAt && (
          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> Auto-saved
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 -mt-1">These get filled into LinkedIn, GitHub, and portfolio fields on application forms.</p>

      {f('linkedin',  'LinkedIn',  'https://linkedin.com/in/yourname',  <Link2 size={13} />)}
      {f('github',    'GitHub',    'https://github.com/yourname',        <Briefcase size={13} />)}
      {f('portfolio', 'Portfolio', 'https://yoursite.com',               <Link2 size={13} />)}
      {f('twitter',   'Twitter/X', 'https://twitter.com/yourname',       <Link2 size={13} />)}

      <button
        onClick={onSave}
        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 mt-2"
      >
        <CheckCircle2 size={14} />
        Save links
      </button>
    </div>
  );
}

// ─── First-time setup ─────────────────────────────────────────────────────────

function SetupWelcome({ draft, setDraft, onSave, savedAt }: {
  draft: Profile;
  setDraft: (p: Profile) => void;
  onSave: () => void;
  savedAt: number | null;
}) {
  const [step, setStep] = useState<'welcome' | 'profile' | 'links'>('welcome');

  if (step === 'welcome') {
    return (
      <div className="w-[400px] bg-white font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">JobPilot</span>
          <span className="font-bold text-violet-600 text-sm tracking-tight">AI</span>
        </div>

        <div className="px-6 py-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-violet-200">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Welcome to JobPilot AI</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Fill any job application in seconds. Set up your profile once and we handle the rest.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { icon: User,       text: 'Fill name, email, phone, location' },
              { icon: Briefcase,  text: 'Fill job title, experience, work auth' },
              { icon: Link2,      text: 'Fill LinkedIn, GitHub, portfolio links' },
              { icon: CheckCircle2, text: 'Works on Greenhouse, Lever, LinkedIn & more' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-violet-500" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('profile')}
            className="w-full py-3 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
          >
            Get started
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] bg-white font-sans">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <button
          onClick={() => setStep(step === 'links' ? 'profile' : 'welcome')}
          className="text-slate-400 hover:text-slate-600 text-base leading-none mr-1"
        >
          ←
        </button>
        <div className="flex-1">
          <span className="font-bold text-slate-800 text-sm">
            {step === 'profile' ? 'Your Information' : 'Profile Links'}
          </span>
          <span className="text-[11px] text-slate-400 ml-2">Step {step === 'profile' ? '1' : '2'} of 2</span>
        </div>
        {savedAt && (
          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> Saved
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3 max-h-[440px] overflow-y-auto">
        {step === 'profile' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" value={draft.firstName} onChange={v => setDraft({ ...draft, firstName: v })} placeholder="Alex" />
              <Field label="Last name"  value={draft.lastName}  onChange={v => setDraft({ ...draft, lastName: v })}  placeholder="Rivera" />
            </div>
            <Field label="Email"   value={draft.email}   onChange={v => setDraft({ ...draft, email: v })}   placeholder="alex@email.com"      type="email" />
            <Field label="Phone"   value={draft.phone}   onChange={v => setDraft({ ...draft, phone: v })}   placeholder="+1 (555) 000-0000"   type="tel" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"  value={draft.city}  onChange={v => setDraft({ ...draft, city: v })}  placeholder="San Francisco" />
              <Field label="State" value={draft.state} onChange={v => setDraft({ ...draft, state: v })} placeholder="CA" />
            </div>
            <Field label="Work authorization" value={draft.workAuthorization} onChange={v => setDraft({ ...draft, workAuthorization: v })} placeholder="US Citizen / H1B / OPT" />
            <Field label="Current job title"  value={draft.currentTitle}      onChange={v => setDraft({ ...draft, currentTitle: v })}      placeholder="Software Engineer" />
            <Field label="Years of experience" value={String(draft.yearsExperience)} onChange={v => setDraft({ ...draft, yearsExperience: Number(v) })} placeholder="3" type="number" />
          </>
        )}

        {step === 'links' && (
          <>
            <p className="text-xs text-slate-400">Optional — these fill LinkedIn, GitHub, and website fields on applications.</p>
            <Field label="LinkedIn URL"  value={draft.linkedin}  onChange={v => setDraft({ ...draft, linkedin: v })}  placeholder="https://linkedin.com/in/yourname" />
            <Field label="GitHub URL"    value={draft.github}    onChange={v => setDraft({ ...draft, github: v })}    placeholder="https://github.com/yourname" />
            <Field label="Portfolio URL" value={draft.portfolio} onChange={v => setDraft({ ...draft, portfolio: v })} placeholder="https://yoursite.com" />
          </>
        )}
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-slate-100">
        {step === 'profile' ? (
          <button
            onClick={() => setStep('links')}
            disabled={!draft.firstName || !draft.email}
            className="w-full py-3 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            Next: Add links
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={onSave}
            className="w-full py-3 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
          >
            <CheckCircle2 size={15} />
            Save & start filling
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-shadow"
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
