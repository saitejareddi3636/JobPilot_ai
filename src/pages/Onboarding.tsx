import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText, Rocket, Upload } from 'lucide-react';
import { mockProfile, mockSavedAnswers } from '../data/mockData';
import { useUpdateProfile } from '../hooks/useProfile';

type OnboardingStep = 1 | 2 | 3 | 4;

const starterPrompts = [
  'Tell us about yourself.',
  'Why do you want to work here?',
  'What is your expected salary range?',
];

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [profile, setProfile] = useState(() => ({ ...mockProfile }));
  const [resumeName, setResumeName] = useState('Frontend_v2.pdf');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [answers, setAnswers] = useState(() => mockSavedAnswers.slice(0, 3).map(answer => answer.answer));
  const [saving, setSaving] = useState(false);
  const updateProfile = useUpdateProfile();

  const progress = useMemo(() => ((step - 1) / 3) * 100, [step]);

  async function markComplete() {
    setSaving(true);
    try {
      await updateProfile({ onboardingDone: true });
      window.location.href = '/';
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.14),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Get ready</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Set up JobPilot in under 3 minutes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Fill your profile, add a resume, seed starter answers, and you are ready to autofill.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            Step {step} of 4
          </div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          {step === 1 && (
            <section className="space-y-6">
              <StepHeader
                icon={ClipboardList}
                title="Profile basics"
                description="These fields are used most often when JobPilot fills out job applications."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full name" value={profile.name} onChange={value => setProfile(p => ({ ...p, name: value }))} />
                <Field label="Email" value={profile.email} onChange={value => setProfile(p => ({ ...p, email: value }))} />
                <Field label="Phone" value={profile.phone} onChange={value => setProfile(p => ({ ...p, phone: value }))} />
                <Field label="Location" value={profile.location} onChange={value => setProfile(p => ({ ...p, location: value }))} />
                <Field label="LinkedIn URL" value={profile.linkedin} onChange={value => setProfile(p => ({ ...p, linkedin: value }))} />
                <Field label="GitHub URL" value={profile.github} onChange={value => setProfile(p => ({ ...p, github: value }))} />
                <Field label="Portfolio URL" value={profile.portfolio} onChange={value => setProfile(p => ({ ...p, portfolio: value }))} />
                <Field label="Work authorization" value={profile.workAuthorization} onChange={value => setProfile(p => ({ ...p, workAuthorization: value }))} />
              </div>

              <div className="flex justify-end">
                <button className="btn-primary" onClick={() => setStep(2)}>
                  Continue
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <StepHeader
                icon={Upload}
                title="Upload a resume"
                description="This is what JobPilot uses to tailor answers and autofill custom fields."
              />

              <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
                <FileText size={32} className="mx-auto text-violet-500" />
                <p className="mt-4 text-sm font-medium text-slate-800">{resumeUploaded ? resumeName : 'Drop a PDF or DOCX here'}</p>
                <p className="mt-1 text-xs text-slate-500">Max 5MB · private by default</p>
                <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-sm ring-1 ring-violet-200 hover:bg-violet-50">
                  <Upload size={14} />
                  Browse files
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      setResumeName(file.name);
                      setResumeUploaded(true);
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button className="btn-primary" onClick={() => setStep(3)}>
                  Continue
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <StepHeader
                icon={FileText}
                title="Starter answers"
                description="These drafts seed your saved answers. Edit them freely."
              />

              <div className="space-y-4">
                {starterPrompts.map((prompt, index) => (
                  <div key={prompt} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{prompt}</p>
                    <textarea
                      value={answers[index]}
                      onChange={event => {
                        const next = [...answers];
                        next[index] = event.target.value;
                        setAnswers(next);
                      }}
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button className="btn-primary" onClick={() => setStep(4)}>
                  Continue
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-6">
              <StepHeader
                icon={Rocket}
                title="Install the extension"
                description="You are ready to use JobPilot. Install the extension, or finish setup now and do it later."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="Add to Chrome"
                  description="Open the Chrome Web Store listing and install JobPilot AI."
                  actionLabel="Open store"
                  onClick={() => window.open('https://chromewebstore.google.com/', '_blank', 'noopener,noreferrer')}
                />
                <InfoCard
                  title="Already installed?"
                  description="Mark onboarding complete and jump straight to the dashboard."
                  actionLabel={saving ? 'Finishing…' : 'Go to dashboard'}
                  onClick={() => void markComplete()}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button className="btn-secondary" onClick={() => setStep(3)}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button className="btn-primary" onClick={() => void markComplete()} disabled={saving}>
                  <CheckCircle2 size={14} />
                  {saving ? 'Saving…' : 'Finish setup'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
      />
    </label>
  );
}

function InfoCard({
  title,
  description,
  actionLabel,
  onClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <button className="btn-primary mt-4 w-full justify-center" onClick={onClick} type="button">
        {actionLabel}
      </button>
    </div>
  );
}
