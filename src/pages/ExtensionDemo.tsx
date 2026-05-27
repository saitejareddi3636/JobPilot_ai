import { PuzzleIcon, Monitor, Smartphone, Info } from 'lucide-react';
import { ExtensionPopup } from '../components/extension/ExtensionPopup';

export default function ExtensionDemo() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chrome Extension Demo</h1>
        <p className="text-slate-500 text-sm mt-1">
          Interactive preview of the extension popup. Click through the full autofill flow.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
        <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
        <div className="text-sm text-sky-700">
          <span className="font-semibold">Demo mode:</span> This is a live interactive mock of the Chrome Extension popup. The flow simulates what a user sees on a real job application page at Stripe. Click <strong>Analyze Page</strong> to begin.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Popup demo */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="relative">
            {/* Browser chrome mock */}
            <div className="bg-slate-700 rounded-t-xl px-3 py-2 flex items-center gap-2 w-96">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-slate-600 rounded-md px-3 py-1 text-xs text-slate-300 truncate">
                stripe.com/jobs/apply/senior-frontend-engineer
              </div>
              <div className="flex items-center gap-1">
                <PuzzleIcon size={13} className="text-violet-400" />
              </div>
            </div>
            {/* Extension popup */}
            <ExtensionPopup />
          </div>
        </div>

        {/* Flow guide */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-900 text-base">How it works</h2>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4 mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Monitor size={15} className="text-slate-400" />
              Platform support
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                Chrome / Brave / Edge (Chromium)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                Firefox (coming soon)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-300 rounded-full" />
                <Smartphone size={11} className="inline" /> Mobile (planned)
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Privacy promise</h3>
            <ul className="text-xs text-slate-500 space-y-1.5">
              {[
                'Your profile data stays on-device',
                'AI answers generated locally or via your private API key',
                'Never auto-submits — always shows review state',
                'No tracking of which jobs you apply to',
              ].map(p => (
                <li key={p} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    title: 'Open extension on any job page',
    desc: 'JobPilot detects the company name and job role automatically from the page URL and title.',
  },
  {
    title: 'Click Analyze Page',
    desc: 'The extension scans the DOM for form fields and matches each one to your profile data.',
  },
  {
    title: 'Review detected fields',
    desc: 'Each field shows a confidence score. Custom questions get AI-generated answers you can edit.',
  },
  {
    title: 'Select your resume',
    desc: 'Choose the tailored resume from your library that best matches this role.',
  },
  {
    title: 'Click Autofill Application',
    desc: 'Watch each field get filled in real time. Progress is shown step by step.',
  },
  {
    title: 'Review before submitting',
    desc: 'JobPilot stops here. You verify everything looks correct, then hit Submit yourself.',
  },
];
