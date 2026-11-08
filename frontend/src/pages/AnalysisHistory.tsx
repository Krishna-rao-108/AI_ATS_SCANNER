import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History,
  FileSearch,
  Search,
  Calendar,
  Briefcase,
  FileText,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { analysisService } from '../services/analysisService';
import type { StoredAnalysisRecord } from '../types/analysis';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils';

export const AnalysisHistory: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<StoredAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        const backendRecords = await analysisService.getBackendHistory();
        if (isMounted) {
          if (backendRecords && backendRecords.length > 0) {
            setRecords(backendRecords);
          } else {
            const sessionRecs = analysisService.getSessionRecords();
            setRecords(sessionRecs);
          }
        }
      } catch (err: any) {
        console.error('Failed to load analysis history from backend:', err);
        if (isMounted) {
          const sessionRecs = analysisService.getSessionRecords();
          setRecords(sessionRecs);
          if (sessionRecs.length === 0) {
            setError(err?.message || 'Unable to connect to analysis history backend.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = records.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (rec.jd_title && rec.jd_title.toLowerCase().includes(q)) ||
      (rec.resume_title && rec.resume_title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
            ATS Analysis History
          </h2>
          <Badge variant="outline" size="sm">
            PostgreSQL Persisted
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-0.5">
          Review past screening evaluations, historical match scores, and parsed skill reports saved to your account.
        </p>
      </div>

      {/* Backend Connected Banner */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] text-xs text-[var(--color-ink-700)] flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
          <Database className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-900)] flex items-center gap-1.5">
            Database Endpoint Active (<code className="text-[var(--color-violet-700)] bg-[var(--color-violet-50)] px-1.5 py-0.5 rounded font-mono text-[11px] border border-[var(--color-violet-100)]">GET /api/analysis/</code>)
          </p>
          <p className="text-[var(--color-ink-500)] leading-relaxed">
            Screening results are persisted in PostgreSQL with strict per-user authorization. Click any past audit to inspect detailed skill breakdowns and recommendations.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Filter by job title or resume..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/analyze')}
          leftIcon={<FileSearch className="w-4 h-4" />}
        >
          New Analysis
        </Button>
      </div>

      {/* Records Table / List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historical Analyses ({filteredRecords.length})</CardTitle>
            <CardDescription>Click any row to open the complete audit report</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-violet-600)] mx-auto" />
              <p className="text-xs text-[var(--color-ink-500)]">Loading analysis history from database...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => navigate('/results', { state: { analysis: rec } })}
                  className="p-4 sm:px-6 hover:bg-[var(--color-raised)]/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center font-bold text-sm shrink-0">
                      {rec.result_data.match_score}%
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[var(--color-ink-900)] truncate">
                        {rec.analysis_type === 'general' || !rec.jd_id
                          ? 'General Resume Check'
                          : (rec.jd_title || `Job Description #${rec.jd_id}`)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-500)] mt-1">
                        <span className="flex items-center gap-1 truncate">
                          <FileText className="w-3.5 h-3.5 text-[var(--color-ink-300)]" />
                          {rec.resume_title || `Resume #${rec.resume_id}`}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[var(--color-ink-500)]">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-ink-300)]" />
                          {formatDate(rec.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <Badge
                      variant={
                        rec.analysis_type === 'general'
                          ? 'violet'
                          : rec.result_data.match_score >= 75
                          ? 'success'
                          : rec.result_data.match_score >= 50
                          ? 'violet'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {rec.analysis_type === 'general'
                        ? 'General Check'
                        : rec.result_data.match_score >= 75
                        ? 'High Alignment'
                        : rec.result_data.match_score >= 50
                        ? 'Moderate'
                        : 'Review Gaps'}
                    </Badge>
                    <span className="text-xs font-semibold text-[var(--color-violet-600)] hover:text-[var(--color-violet-700)] flex items-center gap-1">
                      View Audit <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<History className="w-6 h-6" />}
                title={searchQuery ? 'No matching records found' : 'No analyses found in database'}
                description={
                  searchQuery
                    ? 'Try adjusting your search query filter.'
                    : 'Run a compatibility analysis between a candidate resume and job description to see it recorded here.'
                }
                actionLabel={searchQuery ? undefined : 'Start Analysis'}
                onAction={searchQuery ? undefined : () => navigate('/analyze')}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
