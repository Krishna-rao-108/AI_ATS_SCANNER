import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch,
  UploadCloud,
  Sparkles,
  FileText,
  Files,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useResumes } from '../hooks/useResumes';
import { analysisService } from '../services/analysisService';
import type { StoredAnalysisRecord } from '../types/analysis';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resumes, loading: resumesLoading } = useResumes();
  const [recentAnalyses, setRecentAnalyses] = useState<StoredAnalysisRecord[]>([]);

  useEffect(() => {
    // Load session analyses
    const records = analysisService.getSessionRecords();
    setRecentAnalyses(records);
  }, []);

  const totalResumes = resumes.length;
  const totalAnalyses = recentAnalyses.length;
  const avgScore =
    totalAnalyses > 0
      ? Math.round(
          recentAnalyses.reduce((acc, curr) => acc + (curr.result_data.match_score || 0), 0) /
            totalAnalyses
        )
      : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[var(--shadow-xs)]"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[var(--color-violet-100)]/40 via-[var(--color-violet-50)]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-violet-50)] border border-[var(--color-violet-100)] text-[var(--color-violet-700)] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-violet-600)] animate-pulse" />
              Enterprise ATS Screening Workspace
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink-900)]">
              Welcome back, {user?.name || 'Analyst'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-ink-500)] leading-relaxed">
              Screen resumes against target requirements, identify critical keyword gaps, and generate truthful, grounded application documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/resumes')}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Resume Library
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/analyze')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider">
                  Stored Resumes
                </p>
                {resumesLoading ? (
                  <Skeleton className="h-7 w-14 mt-2" />
                ) : (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[var(--color-ink-900)]">
                      {totalResumes}
                    </span>
                    <span className="text-xs text-[var(--color-ink-500)]">active documents</span>
                  </div>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-violet-50)] text-[var(--color-violet-600)] flex items-center justify-center shrink-0 border border-[var(--color-violet-100)]">
                <Files className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider">
                  Analyses Run
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[var(--color-ink-900)]">
                    {totalAnalyses}
                  </span>
                  <span className="text-xs text-[var(--color-ink-500)]">this session</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <Card className="h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider">
                  Average ATS Match
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[var(--color-ink-900)]">
                    {totalAnalyses > 0 ? `${avgScore}%` : '—'}
                  </span>
                  <span className="text-xs text-[var(--color-ink-500)]">
                    {totalAnalyses > 0 ? 'mean compatibility' : 'awaiting scans'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-raised)] text-[var(--color-ink-700)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[var(--color-ink-900)] uppercase tracking-wider">
            Workspace Tools
          </h3>
          <span className="text-xs text-[var(--color-ink-500)] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Grounded AI Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/resumes')}
            className="group cursor-pointer bg-[var(--color-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--color-violet-400)]/50 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-violet-600)] transition-colors">
                Upload Resume
              </h4>
              <p className="text-xs text-[var(--color-ink-500)] mt-1 leading-relaxed">
                Add PDF or DOCX candidate resumes to extract structured qualifications.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-[var(--color-violet-600)] group-hover:translate-x-0.5 transition-transform">
              Document library <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/analyze')}
            className="group cursor-pointer bg-[var(--color-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--color-violet-400)]/50 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileSearch className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-violet-600)] transition-colors">
                ATS Compatibility
              </h4>
              <p className="text-xs text-[var(--color-ink-500)] mt-1 leading-relaxed">
                Scan resumes against target jobs to calculate semantic score & missing skills.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-[var(--color-violet-600)] group-hover:translate-x-0.5 transition-transform">
              Run evaluation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/tailor')}
            className="group cursor-pointer bg-[var(--color-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--color-violet-400)]/50 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-violet-600)] transition-colors">
                Resume Tailor
              </h4>
              <p className="text-xs text-[var(--color-ink-500)] mt-1 leading-relaxed">
                Zero-hallucination tailoring pipeline. Preserves facts, exports ATS PDF/DOCX.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-[var(--color-violet-600)] group-hover:translate-x-0.5 transition-transform">
              Tailor resume <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/cover-letter')}
            className="group cursor-pointer bg-[var(--color-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--color-violet-400)]/50 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-violet-600)] transition-colors">
                Cover Letter
              </h4>
              <p className="text-xs text-[var(--color-ink-500)] mt-1 leading-relaxed">
                Generate personalized letters mapped to candidate qualifications & role needs.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-[var(--color-violet-600)] group-hover:translate-x-0.5 transition-transform">
              Draft letter <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Recent Screening Analyses</CardTitle>
              <CardDescription>Evaluations generated during this work session</CardDescription>
            </div>
            {recentAnalyses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/history')}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View Full History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentAnalyses.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentAnalyses.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => navigate('/results', { state: { analysis: rec } })}
                  className="p-4 sm:px-6 hover:bg-[var(--color-raised)]/70 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center font-bold text-xs shrink-0">
                      {rec.result_data.match_score}%
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[var(--color-ink-900)] truncate">
                        {rec.analysis_type === 'general' || !rec.jd_id
                          ? 'General Resume Check'
                          : (rec.jd_title || `Job Description #${rec.jd_id}`)}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-500)] mt-0.5">
                        <span className="truncate">{rec.resume_title || `Resume #${rec.resume_id}`}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--color-ink-300)]" />
                          {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        rec.analysis_type === 'general'
                          ? 'info'
                          : rec.result_data.match_score >= 75
                          ? 'success'
                          : rec.result_data.match_score >= 50
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {rec.analysis_type === 'general'
                        ? 'General Check'
                        : rec.result_data.match_score >= 75
                        ? 'High Match'
                        : rec.result_data.match_score >= 50
                        ? 'Moderate'
                        : 'Low Match'}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-[var(--color-ink-300)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<FileSearch className="w-6 h-6" />}
                title="No analyses performed yet"
                description="Upload a candidate resume and compare it against a target job description to generate your first ATS evaluation."
                actionLabel="Start First Analysis"
                onAction={() => navigate('/analyze')}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
