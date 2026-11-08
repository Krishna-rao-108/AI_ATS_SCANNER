import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  Files,
  History,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  group?: string;
}

const navigation: NavItem[] = [
  { name: 'Overview',         href: '/',             icon: LayoutDashboard, group: 'main' },
  { name: 'Analyze Resume',   href: '/analyze',      icon: FileSearch,      group: 'main' },
  { name: 'My Resumes',       href: '/resumes',      icon: Files,           group: 'main' },
  { name: 'Analysis History', href: '/history',      icon: History,         group: 'main' },
  { name: 'Resume Tailor',    href: '/tailor',       icon: Sparkles,        group: 'ai' },
  { name: 'Cover Letter',     href: '/cover-letter', icon: FileText,        group: 'ai' },
  { name: 'Settings',         href: '/settings',     icon: Settings,        group: 'account' },
];

const groups: { key: string; label: string }[] = [
  { key: 'main',    label: 'Workspace' },
  { key: 'ai',      label: 'AI Tools' },
  { key: 'account', label: 'Account' },
];

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-[220px] flex flex-col h-full select-none shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <div
        className="h-14 flex items-center px-5 gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-violet-600), var(--color-violet-700))' }}
        >
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--color-ink-900)] tracking-tight leading-none">
            ResumeAI
          </div>
          <div className="text-[10px] text-[var(--color-ink-300)] font-medium mt-0.5 leading-none">
            Career Workspace
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map((group) => {
          const items = navigation.filter((n) => n.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key}>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-300)]">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === '/'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 group relative',
                          isActive
                            ? 'bg-[var(--color-violet-50)] text-[var(--color-violet-700)]'
                            : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-raised)]'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'w-[15px] h-[15px] shrink-0 transition-colors',
                              isActive
                                ? 'text-[var(--color-violet-600)]'
                                : 'text-[var(--color-ink-300)] group-hover:text-[var(--color-ink-700)]'
                            )}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-violet-200">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <span className="absolute right-2.5 w-1 h-1 rounded-full bg-[var(--color-violet-500)]" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between px-2 py-1.5 rounded-[8px] hover:bg-[var(--color-raised)] transition-colors group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'var(--color-violet-600)' }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--color-ink-900)] truncate leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-[var(--color-ink-300)] truncate leading-tight">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1 text-[var(--color-ink-300)] hover:text-rose-500 rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
