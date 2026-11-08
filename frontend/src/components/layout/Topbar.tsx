import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TopbarProps {
  onOpenMobile: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Overview',               subtitle: 'Your career workspace at a glance' },
  '/analyze':      { title: 'Analyze Resume',         subtitle: 'Match your resume to a job description' },
  '/results':      { title: 'Analysis Results',       subtitle: 'Detailed ATS score and keyword gaps' },
  '/resumes':      { title: 'My Resumes',             subtitle: 'Manage your uploaded resume documents' },
  '/history':      { title: 'Analysis History',       subtitle: 'All past ATS screening reports' },
  '/tailor':       { title: 'Resume Tailor',          subtitle: 'AI-powered job-specific optimisation' },
  '/cover-letter': { title: 'Cover Letter Generator', subtitle: 'Personalised, evidence-based letters' },
  '/settings':     { title: 'Settings',               subtitle: 'Account preferences and credentials' },
};

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageInfo = pageTitles[location.pathname] || {
    title: 'ResumeAI',
    subtitle: 'AI Career Workspace',
  };

  return (
    <header
      className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded-[8px] text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-raised)] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div>
          <h1 className="text-[13px] font-semibold text-[var(--color-ink-900)] leading-tight tracking-tight">
            {pageInfo.title}
          </h1>
          <p className="text-[11px] text-[var(--color-ink-300)] leading-tight hidden sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] hover:bg-[var(--color-raised)] transition-colors border border-transparent focus:border-[var(--border-default)] focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: 'var(--color-violet-600)' }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-[12px] font-medium text-[var(--color-ink-700)] leading-tight max-w-[100px] truncate">
              {user?.name || 'User'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--color-ink-300)] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-52 rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-lg)] py-1.5 z-50"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-[12px] font-semibold text-[var(--color-ink-900)]">{user?.name || 'User'}</p>
                <p className="text-[11px] text-[var(--color-ink-300)] truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-1 px-1.5">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[12px] text-[var(--color-ink-700)] hover:bg-[var(--color-raised)] transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--color-ink-300)]" />
                  Account Settings
                </button>
              </div>

              <div className="py-1 px-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[12px] text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
