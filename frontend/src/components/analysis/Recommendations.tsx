import React from 'react';
import { Lightbulb, CheckCheck, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface RecommendationsProps {
  recommendations: string[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Actionable ATS Optimization Recommendations</CardTitle>
            <CardDescription>
              Evidence-based enhancements suggested by the AI screening engine
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 p-3.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-violet-400)]/40 hover:bg-[var(--color-raised)]/30 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-violet-50)] border border-[var(--color-violet-100)] text-[var(--color-violet-700)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 text-xs sm:text-sm text-[var(--color-ink-700)] leading-relaxed">
                  {rec}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 p-4 rounded-[var(--radius-md)] border border-emerald-200">
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No specific revisions recommended. Your resume aligns closely with the target role.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
