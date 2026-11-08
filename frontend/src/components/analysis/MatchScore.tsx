import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle2, TrendingUp, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface MatchScoreProps {
  score: number;
  isGeneral?: boolean;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ score, isGeneral = false }) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayScore, setDisplayScore] = useState(shouldReduceMotion ? score : 0);

  const radius = 64;
  const stroke = 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayScore(score);
      return;
    }
    const duration = 900;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentVal = Math.round((score / steps) * currentStep);
      if (currentStep >= steps) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(currentVal);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score, shouldReduceMotion]);

  // Color theme according to score
  const getTheme = () => {
    if (score >= 75) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        stroke: '#059669', // emerald-600
        label: isGeneral ? 'Strong Quality' : 'Strong Match',
        verdict: isGeneral ? 'High Structural Alignment' : 'High ATS Likelihood',
        description: isGeneral
          ? 'Resume content demonstrates high clarity, strong formatting, and clear evidence of core technical skills.'
          : 'Resume content demonstrates high topical alignment with job qualifications and core technical skills.',
        icon: CheckCircle2,
      };
    }
    if (score >= 50) {
      return {
        text: 'text-[var(--color-violet-700)]',
        bg: 'bg-[var(--color-violet-50)]',
        border: 'border-[var(--color-violet-100)]',
        stroke: '#7c3aed', // violet-500
        label: isGeneral ? 'Moderate Quality' : 'Moderate Match',
        verdict: isGeneral ? 'Good Foundation with Areas to Improve' : 'Competitive with Gaps',
        description: isGeneral
          ? 'Resume shows relevant background and skills, with opportunities to enhance measurable outcomes and formatting.'
          : 'Resume shows relevant core qualifications, with several addressable keyword gaps that can be strengthened.',
        icon: TrendingUp,
      };
    }
    return {
      text: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      stroke: '#d97706', // amber-600
      label: isGeneral ? 'Needs Improvement' : 'Low Match',
      verdict: isGeneral ? 'Requires Revisions' : 'Requires Substantial Revisions',
      description: isGeneral
        ? 'Key structural and formatting improvements recommended to maximize resume clarity and impact.'
        : 'Significant requirement gaps detected. Highlighting transferable technical skills and aligning terminology is strongly advised.',
      icon: AlertCircle,
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <Card className="overflow-hidden border-[var(--border-subtle)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Animated SVG Ring */}
          <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              {/* Background Track */}
              <circle
                stroke="var(--color-raised)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress Arc */}
              <motion.circle
                stroke={theme.stroke}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: shouldReduceMotion ? 0 : 1.1, ease: 'easeOut' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink-900)] tracking-tight">
                {displayScore}
                <span className="text-sm font-semibold text-[var(--color-ink-300)]">/100</span>
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wider mt-0.5">
                {isGeneral ? 'Quality Score' : 'ATS Index'}
              </span>
            </div>
          </div>

          {/* Score Details & Rating */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {theme.label}
              </span>
              <span className="text-xs text-[var(--color-ink-500)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-violet-600)]" />
                {theme.verdict}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--color-ink-700)] leading-relaxed max-w-xl">
              {theme.description}
            </p>

            <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)] text-[11px] text-[var(--color-ink-500)]">
              <Info className="w-4 h-4 text-[var(--color-ink-300)] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {isGeneral ? (
                  <>
                    <strong className="text-[var(--color-ink-700)] font-semibold">Resume Quality Heuristic:</strong> Evaluates structural formatting, clarity of experience, demonstrable skills, and impactful phrasing without a job description.
                  </>
                ) : (
                  <>
                    <strong className="text-[var(--color-ink-700)] font-semibold">Semantic Match Heuristic:</strong> Evaluates topical relevance, exact keyword frequency, and seniority alignment against the target job requirements.
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
