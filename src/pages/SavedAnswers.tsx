import { useState } from 'react';
import { Search, Plus, Edit3, Trash2, Copy, Check, BarChart2, Clock } from 'lucide-react';
import { mockSavedAnswers } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import type { SavedAnswer } from '../types';
import { useDeleteSavedAnswer, useSavedAnswers, useUpdateSavedAnswer } from '../hooks/useSavedAnswers';

// TODO: GET /api/v1/saved-answers
// TODO: POST /api/v1/saved-answers
// TODO: PATCH /api/v1/saved-answers/:id
// TODO: DELETE /api/v1/saved-answers/:id

const categories = ['All', 'Introduction', 'Motivation', 'Technical', 'Behavioral', 'Personal', 'Compensation', 'Logistics'];

const categoryColors: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  Introduction:  'violet',
  Motivation:    'info',
  Technical:     'warning',
  Behavioral:    'success',
  Personal:      'outline',
  Compensation:  'danger',
  Logistics:     'default',
};

export default function SavedAnswers() {
  const answersState = useSavedAnswers();
  const updateAnswer = useUpdateSavedAnswer();
  const deleteSavedAnswer = useDeleteSavedAnswer();
  const [answers, setAnswers] = useState<SavedAnswer[]>(mockSavedAnswers);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const visibleAnswers = answersState.data ?? answers;

  const filtered = visibleAnswers.filter(a => {
    const matchesCat = category === 'All' || a.category === category;
    const matchesSearch =
      a.question.toLowerCase().includes(search.toLowerCase()) ||
      a.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function startEdit(a: SavedAnswer) {
    setEditingId(a.id);
    setEditText(a.answer);
  }

  function saveEdit(id: string) {
    setAnswers(prev => prev.map(a => a.id === id ? { ...a, answer: editText } : a));
    void updateAnswer(id, { answer: editText });
    setEditingId(null);
  }

  function handleDeleteAnswer(id: string) {
    setAnswers(prev => prev.filter(a => a.id !== id));
    void deleteSavedAnswer(id);
  }

  const totalUsage = visibleAnswers.reduce((s, a) => s + a.usageCount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saved Answers</h1>
          <p className="text-slate-500 text-sm mt-1">
            {answers.length} answers · used {totalUsage} times across applications
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Add Answer
        </button>
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or answers…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Answer cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No answers match your search.</div>
        ) : (
          filtered.map(answer => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              isEditing={editingId === answer.id}
              editText={editText}
              onEditTextChange={setEditText}
              onEdit={startEdit}
              onSave={saveEdit}
              onCancel={() => setEditingId(null)}
              onDelete={handleDeleteAnswer}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Answer Card ──────────────────────────────────────────────────────────────

function AnswerCard({
  answer,
  isEditing,
  editText,
  onEditTextChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  answer: SavedAnswer;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (v: string) => void;
  onEdit: (a: SavedAnswer) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const colorVariant = (categoryColors[answer.category] ?? 'default') as Parameters<typeof Badge>[0]['variant'];

  return (
    <div className={`card p-5 transition-all ${isEditing ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{answer.question}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={colorVariant} size="sm">{answer.category}</Badge>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <BarChart2 size={10} />
              Used {answer.usageCount}×
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock size={10} />
              {answer.lastUsed}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleCopy} className="btn-ghost py-1.5 px-2 text-xs">
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
          <button onClick={() => onEdit(answer)} className="btn-ghost py-1.5 px-2 text-xs">
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => onDelete(answer.id)}
            className="btn-ghost py-1.5 px-2 text-xs text-red-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={e => onEditTextChange(e.target.value)}
            rows={5}
            className="w-full text-sm text-slate-700 border border-violet-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button onClick={() => onSave(answer.id)} className="btn-primary text-xs py-1.5">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600 leading-relaxed">{answer.answer}</p>
      )}
    </div>
  );
}
