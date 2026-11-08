import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileSearch,
  Sparkles,
  Printer,
  Calendar,
  Briefcase,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { MatchScore } from '../components/analysis/MatchScore';
import { SkillsList } from '../components/analysis/SkillsList';
import { KeywordGaps } from '../components/analysis/KeywordGaps';
import { Recommendations } from '../components/analysis/Recommendations';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { analysisService } from '../services/analysisService';
import { formatDate } from '../lib/utils';
import type { StoredAnalysisRecord } from '../types/analysis';

export const AnalysisResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<StoredAnalysisRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if record was passed via react-router location state
    if (location.state?.analysis) {
      setRecord(location.state.analysis);
      return;
    }

    // 2. Otherwise load the most recent session record
    const recent = analysisService.getSessionRecords();
    if (recent.length > 0) {
      setRecord(recent[0]);
      return;
    }

    setLoadError('No analysis report found in the current session. Please run an analysis first.');
  }, [location.state]);

  if (loadError || !record) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-ink-900)]">No Analysis Results Found</h3>
        <p className="text-xs sm:text-sm text-[var(--color-ink-500)] leading-relaxed">
          {loadError || 'Select a candidate resume and job description to perform an ATS screening analysis.'}
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/analyze')}
            leftIcon={<FileSearch className="w-4 h-4" />}
          >
            Start New Analysis
          </Button>
        </div>
      </div>
    );
  }

  const { result_data: result, resume_title, jd_title, created_at } = record;
  const isGeneral = record.analysis_type === 'general' || !record.jd_id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top action bar & breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1.5">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] font-medium inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
              {isGeneral ? 'Resume Quality Audit Report' : 'ATS Screening Audit Report'}
            </h2>
            <Badge variant="violet" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
              {isGeneral ? 'General Check' : 'Verified Run'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-500)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--color-ink-700)]">
              <Briefcase className="w-3.5 h-3.5 text-[var(--color-ink-300)]" />
              {isGeneral
                ? 'General Resume Check (without JD)'
                : (jd_title || (record.jd_id ? `Job Description #${record.jd_id}` : 'General Resume Check'))}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--color-ink-300)]" />
              {resume_title || `Resume #${record.resume_id}`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-[var(--color-ink-300)]">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/analyze')}
            leftIcon={<FileSearch className="w-3.5 h-3.5" />}
          >
            Analyze Another
          </Button>
        </div>
      </div>

      {/* Optional Summary Box */}
      {result.summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 sm:p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] text-xs sm:text-sm text-[var(--color-ink-700)] flex items-start gap-3.5"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-[var(--color-ink-900)]">Executive Evaluation Summary</h4>
            <p className="leading-relaxed text-[var(--color-ink-600)]">{result.summary}</p>
          </div>
        </motion.div>
      )}

      {/* 1. MATCH SCORE HERO */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <MatchScore score={result.match_score} isGeneral={isGeneral} />
      </motion.div>

      {/* 2. SKILLS OVERVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <SkillsList
          matchedSkills={result.matched_skills}
          missingSkills={result.missing_skills}
          strengths={result.strengths}
          gaps={result.gaps}
          isGeneral={isGeneral}
        />
      </motion.div>

      {/* 3. KEYWORD GAPS AUDIT (Only relevant for Job Match with a target JD) */}
      {!isGeneral && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <KeywordGaps
            missingSkills={result.missing_skills}
            matchedSkills={result.matched_skills}
          />
        </motion.div>
      )}

      {/* 4. RECOMMENDATIONS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      >
        <Recommendations recommendations={result.recommendations} />
      </motion.div>

      {/* 5. BOTTOM NEXT ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden"
      >
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-violet-600)]" />
            <h4 className="text-sm font-bold text-[var(--color-ink-900)]">
              Next Step: Evidence-Based Resume Tailoring
            </h4>
          </div>
          <p className="text-xs text-[var(--color-ink-500)] leading-relaxed">
            {isGeneral
              ? 'Take the recommendations and identified skill improvements from this audit directly into the Resume Tailor to optimize and re-frame truthful experiences before applying.'
              : 'Take the missing requirement keywords and recommendations from this audit directly into the Resume Tailor to re-frame truthful experiences without fabricating qualifications.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/tailor')}
            rightIcon={<ExternalLink className="w-4 h-4" />}
          >
            Launch Resume Tailor
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
