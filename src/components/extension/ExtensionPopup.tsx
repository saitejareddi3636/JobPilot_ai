import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Zap, Search, ChevronDown, CheckCircle2, AlertCircle, FileText,
  User, Mail, Phone, MapPin, Link, GitBranch, Upload, Shield,
  Briefcase, Sparkles, Loader2, ArrowRight, RotateCcw, Eye,
  Star,
} from 'lucide-react';
import { ConfidencePill } from '../ui/ConfidencePill';
import { FieldStatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { mockDetectedFields, mockResumes } from '../../data/mockData';
import type { ExtensionStep, DetectedField } from '../../types';

// ─── Field icon map ───────────────────────────────────────────────────────────
const fieldIcons: Record<string, React.ElementType> = {
  'Full Name':                User,
  'Email Address':            Mail,
  'Phone Number':             Phone,
  'Location / City':          MapPin,
  'LinkedIn URL':             Link,
  'GitHub URL':               GitBranch,
  'Portfolio / Website':      Link,
  'Resume Upload':            Upload,
  'Work Authorization':       Shield,
  'Years of Experience':      Briefcase,
  'Why do you want to work at Stripe?': Sparkles,
  'Describe a challenging technical problem you solved.': Sparkles,
};

// ─── Autofill sequence steps ──────────────────────────────────────────────────
const AUTOFILL_SEQUENCE = [
  'Filling Full Name…',
  'Filling Email Address…',
  'Filling Phone Number…',
  'Filling Location…',
  'Filling LinkedIn URL…',
  'Filling GitHub URL…',
  'Uploading Resume…',
  'Setting Work Authorization…',
  'Inserting custom answers…',
  'Finalizing form…',
];

export function ExtensionPopup() {
  const [step, setStep] = useState<ExtensionStep>('idle');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(mockDetectedFields.map(f => [f.id, f.aiAnswer ?? f.value])),
  );
  const [fillProgress, setFillProgress] = useState(0);
  const [fillLabel, setFillLabel] = useState('');
  const [selectedResume, setSelectedResume] = useState(mockResumes[0].id);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleAnalyze() {
    setStep('analyzing');
    setTimeout(() => setStep('fields_detected'), 2200);
  }

  function handleAutofill() {
    setStep('autofilling');
    setFillProgress(0);
    let i = 0;
    setFillLabel(AUTOFILL_SEQUENCE[0]);
    progressRef.current = setInterval(() => {
      i++;
      const pct = Math.round((i / AUTOFILL_SEQUENCE.length) * 100);
      setFillProgress(pct);
      setFillLabel(AUTOFILL_SEQUENCE[Math.min(i, AUTOFILL_SEQUENCE.length - 1)]);
      if (i >= AUTOFILL_SEQUENCE.length) {
        clearInterval(progressRef.current!);
        setTimeout(() => setStep('review_required'), 400);
      }
    }, 380);
  }

  function handleReset() {
    clearInterval(progressRef.current!);
    setStep('idle');
    setFillProgress(0);
  }

  useEffect(() => () => clearInterval(progressRef.current!), []);

  const activeResume = mockResumes.find(r => r.id === selectedResume)!;
  const customFields = mockDetectedFields.filter(f => f.isCustomQuestion);
  const standardFields = mockDetectedFields.filter(f => !f.isCustomQuestion);
  const readyCount = mockDetectedFields.filter(f => f.status !== 'empty').length;

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      style={{ width: 384, maxHeight: 620 }}
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">JobPilot AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs">Active</span>
        </div>
      </div>

      {/* ── Page info ── */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center text-white text-[10px] font-bold">S</div>
              <span className="text-sm font-semibold text-slate-900">Stripe</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-8">Senior Frontend Engineer</p>
          </div>
          {step !== 'idle' && step !== 'analyzing' && (
            <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* IDLE */}
        {step === 'idle' && (
          <div className="p-5 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mt-2">
              <Search size={28} className="text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Ready to help</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                JobPilot detected a job application on this page. Click below to analyze all fields and prepare your answers.
              </p>
            </div>
            <button onClick={handleAnalyze} className="btn-primary w-full justify-center py-2.5">
              <Search size={15} />
              Analyze Page
            </button>
            <p className="text-[11px] text-slate-400">
              Your data never leaves your device without review.
            </p>
          </div>
        )}

        {/* ANALYZING */}
        {step === 'analyzing' && (
          <div className="p-5 flex flex-col items-center text-center gap-5 py-10">
            <div className="relative">
              <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center">
                <Loader2 size={26} className="text-violet-600 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Analyzing page…</h3>
              <p className="text-xs text-slate-500 mt-1">Detecting form fields and matching your profile</p>
            </div>
            <div className="w-full space-y-2">
              {['Scanning DOM for form fields', 'Matching fields to your profile', 'Generating AI answers'].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-500">
                  <Loader2 size={11} className="text-violet-400 animate-spin shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FIELDS DETECTED */}
        {step === 'fields_detected' && (
          <div className="pb-2">
            {/* Summary bar */}
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  {readyCount}/{mockDetectedFields.length} fields ready
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">{customFields.length} AI answers</span>
            </div>

            {/* Resume selector */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Resume</p>
              <div className="relative">
                <button
                  onClick={() => setShowResumeDropdown(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors"
                >
                  <FileText size={13} className="text-violet-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 flex-1 truncate">{activeResume.name}</span>
                  {activeResume.isDefault && (
                    <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">Default</span>
                  )}
                  <ChevronDown size={12} className="text-slate-400 shrink-0" />
                </button>
                {showResumeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
                    {mockResumes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedResume(r.id); setShowResumeDropdown(false); }}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors',
                          selectedResume === r.id && 'bg-violet-50',
                        )}
                      >
                        <FileText size={12} className={clsx(selectedResume === r.id ? 'text-violet-500' : 'text-slate-400')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-400">{r.applications} apps · {(r.sizeKb / 1024).toFixed(2)} MB</p>
                        </div>
                        {r.isDefault && <Star size={11} className="text-amber-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Standard fields */}
            <div className="px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Profile Fields</p>
              <div className="space-y-1.5">
                {standardFields.map(field => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={fieldValues[field.id]}
                  />
                ))}
              </div>
            </div>

            {/* Custom questions */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Custom Questions</p>
                <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">AI Generated</span>
              </div>
              <div className="space-y-2">
                {customFields.map(field => (
                  <CustomQuestionField
                    key={field.id}
                    field={field}
                    value={fieldValues[field.id]}
                    isEditing={editingField === field.id}
                    onEditToggle={() => setEditingField(editingField === field.id ? null : field.id)}
                    onChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUTOFILLING */}
        {step === 'autofilling' && (
          <div className="p-5 flex flex-col gap-5 py-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Filling your application…</h3>
              <p className="text-xs text-slate-500 mt-1">Please don't close this tab</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">{fillLabel}</span>
                <span className="text-violet-600 font-semibold">{fillProgress}%</span>
              </div>
              <ProgressBar value={fillProgress} color="violet" height="lg" animated />
            </div>
            <div className="space-y-1.5">
              {AUTOFILL_SEQUENCE.map((s, i) => {
                const done = (i / AUTOFILL_SEQUENCE.length) * 100 < fillProgress;
                const current = fillLabel === s;
                return (
                  <div key={i} className={clsx('flex items-center gap-2 text-xs transition-all', done || current ? 'opacity-100' : 'opacity-30')}>
                    {done ? (
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    ) : current ? (
                      <Loader2 size={12} className="text-violet-500 animate-spin shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span className={clsx(done ? 'text-slate-500 line-through' : current ? 'text-slate-800 font-medium' : 'text-slate-400')}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REVIEW REQUIRED */}
        {step === 'review_required' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={26} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-900">Application Filled!</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                All fields have been filled in. Please review everything carefully before you submit.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Review Required</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  JobPilot never auto-submits. Please scroll through each field, verify the answers are accurate, and submit when you're ready.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Fields filled', value: `${mockDetectedFields.length}/${mockDetectedFields.length}` },
                { label: 'Time saved', value: '~7 min' },
                { label: 'Resume', value: activeResume.filename.replace('.pdf', '') },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-slate-800">{item.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full justify-center" onClick={handleReset}>
              <Eye size={14} />
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* ── Footer action ── */}
      {step === 'fields_detected' && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <button onClick={handleAutofill} className="btn-primary w-full justify-center py-2.5">
            <Zap size={14} />
            Autofill Application
            <ArrowRight size={14} className="ml-auto" />
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            You'll review before submitting
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({
  field,
  value,
}: {
  field: DetectedField;
  value: string;
}) {
  const Icon = fieldIcons[field.label] ?? User;
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 group transition-colors">
      <div className="w-7 h-7 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 leading-tight">{field.label}</p>
        <p className="text-xs font-medium text-slate-700 truncate">{value || '—'}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <ConfidencePill score={field.confidence} />
        <FieldStatusBadge status={field.status} />
      </div>
    </div>
  );
}

function CustomQuestionField({
  field,
  value,
  isEditing,
  onEditToggle,
  onChange,
}: {
  field: DetectedField;
  value: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className={clsx('rounded-xl border transition-all', isEditing ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-white')}>
      <button
        onClick={onEditToggle}
        className="w-full flex items-start gap-2.5 p-3 text-left"
      >
        <Sparkles size={13} className="text-violet-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-600 leading-snug line-clamp-2">
            {field.label}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <ConfidencePill score={field.confidence} />
            <FieldStatusBadge status={field.status} />
            <span className="text-[10px] text-violet-600 font-medium">
              {isEditing ? '▲ Collapse' : '▼ Edit answer'}
            </span>
          </div>
        </div>
      </button>
      {isEditing && (
        <div className="px-3 pb-3">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={5}
            className="w-full text-xs text-slate-700 border border-violet-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            placeholder="AI answer will appear here…"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {value.length} chars · Edit freely — this is your answer
          </p>
        </div>
      )}
    </div>
  );
}
