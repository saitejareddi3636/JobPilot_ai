import { useEffect, useState } from 'react';
import { User, KeyRound, Bell, Shield, Sliders, ChevronRight, CheckCircle2, Save } from 'lucide-react';
import { mockProfile } from '../data/mockData';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

// TODO: GET /api/v1/profile  and  PATCH /api/v1/profile

type SettingsTab = 'profile' | 'ai' | 'notifications' | 'privacy' | 'extension';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'ai',            label: 'AI Settings',   icon: Sliders },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'extension',     label: 'Extension',     icon: KeyRound },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState(mockProfile);
  const [saved, setSaved] = useState(false);
  const profileState = useProfile();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profileState.data) {
      setProfile(profileState.data);
    }
  }, [profileState.data]);

  async function handleSave() {
    await updateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile, AI preferences, and extension settings</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-0.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? 'text-violet-500' : 'text-slate-400'} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={12} className="ml-auto text-violet-400" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <ProfileTab profile={profile} onChange={setProfile} onSave={handleSave} saved={saved} />
          )}
          {activeTab === 'ai' && <AISettingsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'privacy' && <PrivacyTab />}
          {activeTab === 'extension' && <ExtensionTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({
  profile,
  onChange,
  onSave,
  saved,
}: {
  profile: typeof mockProfile;
  onChange: (p: typeof mockProfile) => void;
  onSave: () => void;
  saved: boolean;
}) {
  function field(key: keyof typeof profile) {
    return (
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          value={profile[key] as string}
          onChange={e => onChange({ ...profile, [key]: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Personal Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">Used to fill standard fields on job applications</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
          <button onClick={onSave} className="btn-primary">
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
          {profile.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{profile.name}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <button className="text-xs text-violet-600 hover:underline mt-0.5">Change avatar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('name')}
        {field('email')}
        {field('phone')}
        {field('location')}
        {field('linkedin')}
        {field('github')}
        {field('portfolio')}
        {field('workAuthorization')}
      </div>
    </div>
  );
}

// ─── AI Settings Tab ──────────────────────────────────────────────────────────

function AISettingsTab() {
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="font-semibold text-slate-900">AI Answer Generation</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure how JobPilot generates custom question answers</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Answer Tone</label>
          <div className="flex gap-2">
            {['professional', 'conversational', 'concise'].map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  tone === t ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Answer Length</label>
          <div className="flex gap-2">
            {['short', 'medium', 'detailed'].map(l => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  length === l ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            API Key (optional)
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Leave blank to use JobPilot's shared AI. Add your own key for priority access.
          </p>
          {/* TODO: encrypt and store API key securely — never log or expose it */}
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">Your key is stored locally and never sent to our servers.</p>
        </div>
      </div>

      <button className="btn-primary">
        <Save size={14} />
        Save AI Settings
      </button>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    interviewScheduled: true,
    offerReceived: true,
    weeklyDigest: true,
    newAnswerSuggested: false,
    reminderFollowUp: true,
  });

  const togglePref = (key: keyof typeof prefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));

  const notifItems = [
    { key: 'interviewScheduled' as const, label: 'Interview scheduled', desc: 'Get notified when an application moves to interview stage' },
    { key: 'offerReceived' as const, label: 'Offer received', desc: 'Celebrate offers and track compensation' },
    { key: 'weeklyDigest' as const, label: 'Weekly activity digest', desc: 'Summary of applications filled, interviews, and stats' },
    { key: 'newAnswerSuggested' as const, label: 'New answer suggestions', desc: 'When AI detects a question you have not answered before' },
    { key: 'reminderFollowUp' as const, label: 'Follow-up reminders', desc: 'Remind you to follow up on applications after 1 week' },
  ];

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Choose which events you want to be notified about</p>
      </div>
      {notifItems.map(item => (
        <div key={item.key} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
          <button
            onClick={() => togglePref(item.key)}
            className={`w-11 h-6 rounded-full transition-all shrink-0 relative mt-0.5 ${prefs[item.key] ? 'bg-violet-600' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${prefs[item.key] ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Privacy Tab ──────────────────────────────────────────────────────────────

function PrivacyTab() {
  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Privacy & Data</h2>
        <p className="text-xs text-slate-500 mt-0.5">Your data, your control</p>
      </div>
      <div className="space-y-3">
        {[
          { title: 'Profile data storage', desc: 'Your name, email, and profile data are stored locally on your device.' },
          { title: 'AI answer generation', desc: 'Answers are generated using your resume context. No raw data is sent without your API key.' },
          { title: 'Application tracking', desc: 'Application history is stored locally. Sync is opt-in.' },
          { title: 'No auto-submit policy', desc: 'JobPilot never submits applications automatically. You always review first.' },
        ].map(item => (
          <div key={item.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-slate-100">
        <button className="text-sm text-red-500 hover:underline">Export my data</button>
        <span className="mx-3 text-slate-300">·</span>
        <button className="text-sm text-red-500 hover:underline">Delete account</button>
      </div>
    </div>
  );
}

// ─── Extension Tab ────────────────────────────────────────────────────────────

function ExtensionTab() {
  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Chrome Extension</h2>
        <p className="text-xs text-slate-500 mt-0.5">Installation and configuration</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Extension connected</p>
          <p className="text-xs text-emerald-700 mt-0.5">JobPilot AI v1.2.4 · Last synced just now</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Auto-detect job pages', desc: 'Show extension badge on known job application URLs' },
          { label: 'One-click analyze', desc: 'Skip the idle state and auto-analyze when opening the popup' },
          { label: 'Confidence threshold', desc: 'Only show fields with ≥80% confidence' },
          { label: 'Dark mode popup', desc: 'Use dark theme in the extension popup' },
        ].map((item, i) => (
          <div key={item.label} className="flex items-start justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <button className={`w-11 h-6 rounded-full shrink-0 relative mt-0.5 ${i < 2 ? 'bg-violet-600' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow ${i < 2 ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
