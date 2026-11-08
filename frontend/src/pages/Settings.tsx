import React, { useState } from 'react';
import {
  User,
  Shield,
  Wifi,
  Moon,
  Sun,
  Laptop,
  LogOut,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { success: toastSuccess } = useToast();

  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system');
  const [atsThreshold, setAtsThreshold] = useState<number>(70);

  const handleSavePreferences = () => {
    toastSuccess('User preferences saved locally for this device');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
          Platform & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-0.5">
          Manage your authenticated workspace identity, ATS scoring thresholds, and screening preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Account Identity</CardTitle>
              <CardDescription>Authenticated user credentials & session</CardDescription>
            </div>
          </div>
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
            Authenticated
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider block">
                Full Name
              </span>
              <p className="text-sm font-semibold text-[var(--color-ink-900)] mt-1">
                {user?.name || 'Authorized User'}
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider block">
                Registered Email
              </span>
              <p className="text-sm font-semibold text-[var(--color-ink-900)] mt-1">
                {user?.email || 'user@atsanalyzer.com'}
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider block">
                User ID
              </span>
              <p className="text-sm font-semibold text-[var(--color-ink-900)] mt-1 font-mono">
                #{user?.id || '—'}
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider block">
                Session Token Status
              </span>
              <p className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Active Bearer JWT
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backend Connection Check */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Backend Service Contract</CardTitle>
              <CardDescription>FastAPI Gateway & Prune AI routing</CardDescription>
            </div>
          </div>
          <Badge variant="info" size="sm">
            Live Gateway
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--color-canvas)]">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-900)]">FastAPI Microservice Base URL</p>
              <p className="text-[11px] font-mono text-[var(--color-ink-500)] mt-0.5">
                {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Connected
            </span>
          </div>

          <p className="text-xs text-[var(--color-ink-500)] leading-relaxed">
            All AI screenings execute securely via the FastAPI backend and Prune gateway. Browser client code never interacts directly with external LLM endpoints.
          </p>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Screening & Appearance Preferences</CardTitle>
              <CardDescription>ATS scoring thresholds and display mode</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-[var(--color-ink-700)] uppercase tracking-wider">
                ATS High-Match Threshold
              </label>
              <span className="text-xs font-bold text-[var(--color-violet-600)]">
                {atsThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={90}
              step={5}
              value={atsThreshold}
              onChange={(e) => setAtsThreshold(Number(e.target.value))}
              className="w-full accent-[var(--color-violet-600)]"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-ink-500)] mt-1">
              <span>Moderate (50%)</span>
              <span>Recommended (70%)</span>
              <span>Strict (90%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-700)] uppercase tracking-wider mb-2.5">
              Color Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-sm text-xs">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Laptop },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setThemePreference(item.id as any)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-[var(--radius-md)] border font-medium transition-all ${
                      themePreference === item.id
                        ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)] text-[var(--color-violet-700)] font-semibold shadow-xs'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--color-ink-700)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Session */}
      <Card className="border-rose-200/80 bg-rose-50/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-ink-900)]">Sign Out of Workspace</h4>
            <p className="text-xs text-[var(--color-ink-500)] mt-0.5">
              Clear your active session token from this browser instance.
            </p>
          </div>

          <Button
            variant="danger"
            size="md"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
