import { ArrowUpRight, Clock, BarChart3, TrendingUp, Zap, FileText, PuzzleIcon, CheckCircle2, Calendar, Star, Trophy } from 'lucide-react';
import { mockStats, mockActivity, mockApplications } from '../data/mockData';
import { AppStatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import type { ActivityType } from '../types';
import { useActivityFeed, useDashboardStats } from '../hooks/useStats';
import { useApplications } from '../hooks/useApplications';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useProfile } from '../hooks/useProfile';

// ─── Activity icon map ────────────────────────────────────────────────────────
const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  filled:          { icon: Zap,          color: 'text-violet-600', bg: 'bg-violet-100' },
  interview:       { icon: Calendar,     color: 'text-sky-600',    bg: 'bg-sky-100' },
  offer:           { icon: Trophy,       color: 'text-amber-600',  bg: 'bg-amber-100' },
  resume_uploaded: { icon: FileText,     color: 'text-emerald-600',bg: 'bg-emerald-100' },
  answer_saved:    { icon: Star,         color: 'text-rose-500',   bg: 'bg-rose-100' },
};

export default function Dashboard() {
  const statsState = useDashboardStats();
  const activityState = useActivityFeed(10);
  const applicationsState = useApplications({ limit: 5 });
  const profileState = useProfile();

  const stats = statsState.data ?? mockStats;
  const activity = activityState.data ?? mockActivity;
  const recent = applicationsState.data?.data?.slice(0, 5) ?? mockApplications.slice(0, 5);
  const hasError = !!(statsState.error || activityState.error || applicationsState.error);
  const profile = profileState.data;
  const completeness = profile
    ? [profile.name, profile.email, profile.phone, profile.location, profile.linkedin, profile.github, profile.portfolio, profile.workAuthorization]
        .filter(Boolean)
        .length * 12.5
    : 0;
  const missingFields = profile
    ? [
        !profile.portfolio && 'Portfolio URL',
        !profile.workAuthorization && 'Work authorization',
        !profile.phone && 'Phone',
        !profile.location && 'Location',
      ].filter(Boolean) as string[]
    : [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your job search at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Extension Active
          </Badge>
        </div>
      </div>

      {profile && !profile.onboardingDone && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-900">Finish onboarding to get better autofill</p>
              <p className="mt-1 text-xs text-violet-700">
                Profile completeness: {Math.min(100, completeness)}%{missingFields.length ? ` · Missing ${missingFields.join(' · ')}` : ''}
              </p>
            </div>
            <a href="/onboarding" className="btn-primary whitespace-nowrap">
              Complete setup
            </a>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsState.loading ? (
          Array.from({ length: 4 }).map((_, idx) => <StatCardSkeleton key={idx} />)
        ) : (
          <>
            <StatCard
              icon={Zap}
              label="Total Applications"
              value={stats.totalApplications}
              sub={`+${stats.applicationsThisWeek} this week`}
              iconColor="text-violet-600"
              iconBg="bg-violet-100"
            />
            <StatCard
              icon={Clock}
              label="Time Saved"
              value={`${stats.timeSavedMinutes}m`}
              sub="vs manual filling"
              iconColor="text-sky-600"
              iconBg="bg-sky-100"
            />
            <StatCard
              icon={BarChart3}
              label="Interview Rate"
              value={`${stats.interviewRate}%`}
              sub="of submitted apps"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              icon={TrendingUp}
              label="Fill Success"
              value={`${stats.successRate}%`}
              sub="forms completed"
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
          </>
        )}
      </div>

      {hasError && (
        <ErrorState
          message="Some dashboard data failed to load."
          onRetry={() => {
            statsState.refetch();
            activityState.refetch();
            applicationsState.refetch();
          }}
        />
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent applications */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Applications</h2>
            <a href="#/history" className="text-xs text-violet-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map(app => (
              <div key={app.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: app.logoColor }}
                >
                  {app.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{app.company}</p>
                  <p className="text-xs text-slate-500 truncate">{app.role}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <AppStatusBadge status={app.status} />
                  <p className="text-[11px] text-slate-400">{app.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="px-5 py-3 space-y-3">
            {activity.map(item => {
              const cfg = activityConfig[item.type];
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">{item.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={PuzzleIcon}
          title="Try Extension Demo"
          desc="See the full popup flow with mock data"
          href="/extension"
          color="violet"
        />
        <QuickAction
          icon={FileText}
          title="Manage Resumes"
          desc="Upload, edit, and set a default resume"
          href="/resumes"
          color="sky"
        />
        <QuickAction
          icon={CheckCircle2}
          title="Saved Answers"
          desc="Build your answer library for common questions"
          href="/saved-answers"
          color="emerald"
        />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card px-5 py-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="card px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={19} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  href,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  color: 'violet' | 'sky' | 'emerald';
}) {
  const colorMap = {
    violet: { bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200', icon: 'text-violet-600 bg-violet-100', text: 'text-violet-700' },
    sky:    { bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',          icon: 'text-sky-600 bg-sky-100',       text: 'text-sky-700' },
    emerald:{ bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', icon: 'text-emerald-600 bg-emerald-100', text: 'text-emerald-700' },
  };
  const c = colorMap[color];
  return (
    <a
      href={href}
      className={`block rounded-xl border p-4 transition-all duration-150 group ${c.bg}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.icon}`}>
        <Icon size={18} />
      </div>
      <p className={`text-sm font-semibold ${c.text}`}>{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </a>
  );
}
