import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  PuzzleIcon,
  History,
  BookOpen,
  Bookmark,
  Settings,
  Zap,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { mockProfile } from '../../data/mockData';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../auth/useAuth';
import { Skeleton } from '../ui/Skeleton';

const navItems = [
  { to: '/',              label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/extension',    label: 'Extension Demo',   icon: PuzzleIcon },
  { to: '/history',      label: 'App History',      icon: History },
  { to: '/resumes',      label: 'Resume Library',   icon: BookOpen },
  { to: '/saved-answers',label: 'Saved Answers',    icon: Bookmark },
  { to: '/settings',     label: 'Settings',         icon: Settings },
];

export function Sidebar() {
  const profileState = useProfile();
  const { signOut } = useAuth();
  const profile = profileState.data ?? mockProfile;

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200 shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <Zap className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">JobPilot</span>
            <span className="font-bold text-violet-600 text-sm tracking-tight"> AI</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'sidebar-item',
                isActive ? 'active' : 'text-slate-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={clsx(isActive ? 'text-violet-600' : 'text-slate-400')} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-violet-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 py-3 border-t border-slate-100">
        {profileState.loading ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{profile.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
