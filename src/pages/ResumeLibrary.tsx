import { useState } from 'react';
import { FileText, Upload, Star, Trash2, MoreHorizontal, CheckCircle2, Tag } from 'lucide-react';
import { mockResumes } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import type { Resume } from '../types';
import { useDeleteResume, useResumes, useSetDefaultResume } from '../hooks/useResumes';

// TODO: POST /api/v1/resumes  (multipart form upload)
// TODO: DELETE /api/v1/resumes/:id
// TODO: PATCH /api/v1/resumes/:id  { isDefault: true }

export default function ResumeLibrary() {
  const resumesState = useResumes();
  const setDefaultResume = useSetDefaultResume();
  const deleteResume = useDeleteResume();
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);
  const [dragging, setDragging] = useState(false);

  const visibleResumes = resumesState.data ?? resumes;

  async function setDefault(id: string) {
    try {
      const next = await setDefaultResume(id);
      if (next) {
        setResumes(r =>
          r.map(resume => {
            if (resume.id === next.id) {
              return { ...resume, ...next, isDefault: true };
            }
            return { ...resume, isDefault: false };
          })
        );
      }
      await resumesState.refetch();
    } catch {
      setResumes(r => r.map(resume => ({ ...resume, isDefault: resume.id === id })));
    }
  }

  async function removeResume(id: string) {
    try {
      await deleteResume(id);
      setResumes(r => r.filter(resume => resume.id !== id));
      await resumesState.refetch();
    } catch {
      setResumes(r => r.filter(resume => resume.id !== id));
    }
  }

  const defaultResume = visibleResumes.find(r => r.isDefault);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Library</h1>
          <p className="text-slate-500 text-sm mt-1">
            {visibleResumes.length} resumes · <span className="text-violet-600 font-medium">{defaultResume?.name}</span> is default
          </p>
        </div>
        <button className="btn-primary">
          <Upload size={15} />
          Upload Resume
        </button>
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); /* TODO: handle file drop */ }}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
          dragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dragging ? 'bg-violet-100' : 'bg-slate-100'}`}>
          <Upload size={22} className={dragging ? 'text-violet-600' : 'text-slate-400'} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {dragging ? 'Drop to upload' : 'Drag & drop your resume here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOCX up to 5MB</p>
        </div>
        <button className="btn-secondary text-xs py-1.5 px-3">Browse files</button>
      </div>

      {/* Resume grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
        {visibleResumes.map(resume => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            onSetDefault={setDefault}
            onRemove={removeResume}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="card px-5 py-4 bg-violet-50 border-violet-200">
        <h3 className="text-sm font-semibold text-violet-900 mb-2">Resume tips</h3>
        <ul className="space-y-1.5 text-xs text-violet-700">
          {[
            'Create a separate resume for each major role type (frontend, full-stack, mobile).',
            'Name your resumes clearly — the extension shows the name in the popup.',
            'Set a default resume for your most common application type.',
            'Keep resumes under 1 page for most applications.',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-1.5">
              <CheckCircle2 size={11} className="text-violet-500 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  onSetDefault,
  onRemove,
}: {
  resume: Resume;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`card p-5 flex flex-col gap-4 relative transition-all ${resume.isDefault ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}>
      {resume.isDefault && (
        <div className="absolute -top-2.5 left-4">
          <Badge variant="violet" size="sm">
            <Star size={10} className="fill-violet-600" />
            Default
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-14 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200 shrink-0">
          <FileText size={18} className="text-red-400" />
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">PDF</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{resume.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{resume.filename}</p>
          <p className="text-xs text-slate-400">{(resume.sizeKb / 1024).toFixed(2)} MB · Used {resume.applications}×</p>
          <p className="text-xs text-slate-400">Last used: {resume.lastUsed}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-lg border border-slate-200 shadow-lg z-10 py-1 min-w-[140px]">
              {!resume.isDefault && (
                <button
                  onClick={() => { onSetDefault(resume.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Star size={12} className="text-amber-500" />
                  Set as default
                </button>
              )}
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left"
                onClick={() => setShowMenu(false)}
              >
                <FileText size={12} className="text-violet-500" />
                Preview
              </button>
              <button
                onClick={() => { onRemove(resume.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 text-left"
              >
                <Trash2 size={12} />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {resume.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            <Tag size={9} />
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!resume.isDefault && (
          <button
            onClick={() => onSetDefault(resume.id)}
            className="btn-ghost text-xs py-1.5 flex-1 justify-center"
          >
            <Star size={13} />
            Set Default
          </button>
        )}
        {resume.isDefault && (
          <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium flex-1">
            <CheckCircle2 size={13} />
            Default resume
          </div>
        )}
        <button className="btn-secondary text-xs py-1.5 flex-1 justify-center">
          <FileText size={13} />
          Preview
        </button>
      </div>
    </div>
  );
}
