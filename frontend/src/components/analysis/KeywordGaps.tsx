import React from 'react';
import { Target, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface KeywordGapsProps {
  missingSkills: string[];
  matchedSkills: string[];
}

export const KeywordGaps: React.FC<KeywordGapsProps> = ({ missingSkills, matchedSkills }) => {
  const totalKeywords = missingSkills.length + matchedSkills.length;
  const coveragePercent = totalKeywords > 0 ? Math.round((matchedSkills.length / totalKeywords) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Keyword Alignment & Gap Audit</CardTitle>
              <CardDescription>
                Exact requirement keywords parsed from the target job description
              </CardDescription>
            </div>
          </div>
          {totalKeywords > 0 && (
            <div className="text-right">
              <span className="text-sm font-bold text-[var(--color-ink-900)]">{coveragePercent}%</span>
              <span className="text-[10px] text-[var(--color-ink-500)] block uppercase tracking-wider font-medium">
                Keyword Coverage
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Coverage Progress Bar */}
        {totalKeywords > 0 && (
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-[var(--color-raised)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-violet-500)] to-emerald-500 transition-all duration-500"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[var(--color-ink-500)]">
              <span>{matchedSkills.length} matched keywords</span>
              <span>{missingSkills.length} missing keywords</span>
            </div>
          </div>
        )}

        {missingSkills.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Missing Requirement Keywords ({missingSkills.length})
              </h5>
              <span className="text-[11px] text-[var(--color-ink-500)]">
                Incorporate truthful experience where applicable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {missingSkills.map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border border-rose-100 bg-rose-50/40 text-xs transition-colors hover:border-rose-200"
                >
                  <span className="font-semibold text-rose-950 truncate mr-2">{keyword}</span>
                  <Badge variant="danger" size="sm" className="text-[10px] shrink-0">
                    Not Found
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[var(--radius-md)] bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Optimal alignment:</strong> All primary skills mentioned in the job description appear reflected in candidate qualifications!</span>
          </div>
        )}

        {/* Truthful Guidance Box */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--color-ink-700)] flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[var(--color-ink-300)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--color-ink-900)]">Enterprise AI Integrity:</strong> Only include missing keywords if you possess demonstrable, factual experience with those tools or methodologies. Never fabricate qualifications to bypass automated screening filters.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
