import { useState } from 'react';
import { Search, Filter, ExternalLink, Clock } from 'lucide-react';
import { mockApplications } from '../data/mockData';
import { AppStatusBadge } from '../components/ui/StatusBadge';
import type { ApplicationStatus } from '../types';
import { useApplications } from '../hooks/useApplications';

const statusFilters: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer' },
  { value: 'rejected',  label: 'Rejected' },
];

export default function ApplicationHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const applicationsState = useApplications({ status: statusFilter, search, limit: 100 });

  const filtered = applicationsState.data?.data ?? mockApplications.filter(app => {
    const matchesSearch =
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSaved = mockApplications.reduce((s, a) => s + a.timeSavedSeconds, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application History</h1>
          <p className="text-slate-500 text-sm mt-1">
            {mockApplications.length} applications · {Math.round(totalSaved / 60)} minutes saved total
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total', count: mockApplications.length, color: 'bg-slate-100 text-slate-700' },
          { label: 'Interviews', count: mockApplications.filter(a => a.status === 'interview').length, color: 'bg-sky-100 text-sky-700' },
          { label: 'Offers', count: mockApplications.filter(a => a.status === 'offer').length, color: 'bg-amber-100 text-amber-700' },
          { label: 'Rejected', count: mockApplications.filter(a => a.status === 'rejected').length, color: 'bg-red-100 text-red-600' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${s.color}`}>
            <span className="font-bold">{s.count}</span>
            <span className="opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or role…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fields</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Saved</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No applications match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: app.logoColor }}
                        >
                          {app.company[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.company}</p>
                          <a
                            href="#"
                            className="text-[11px] text-slate-400 hover:text-violet-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {app.url} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">{app.role}</td>
                    <td className="px-4 py-3.5"><AppStatusBadge status={app.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{app.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-700 font-medium">{app.fieldsFilled}</span>
                      <span className="text-xs text-slate-400">/{app.fieldsDetected}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Clock size={11} />
                        {Math.round(app.timeSavedSeconds / 60)}m
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 truncate max-w-[120px]">{app.resumeUsed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
