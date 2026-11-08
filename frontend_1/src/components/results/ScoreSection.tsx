import { motion, useReducedMotion } from "framer-motion";
import { Info, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ScoreRing, scoreTone } from "@/components/app/ScoreRing";
import { Badge } from "@/components/ui/badge";
import type { ScoreBreakdownItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ScoreSectionProps {
  score: number;
  explanation?: string | null;
  breakdown?: ScoreBreakdownItem[];
}

export function ScoreSection({ score, explanation, breakdown }: ScoreSectionProps) {
  const reduce = useReducedMotion();

  const getScoreVerdict = (s: number) => {
    if (s >= 75) {
      return {
        label: "Strong Fit",
        badgeVariant: "border-success/40 bg-success-soft text-success",
        desc: "Candidate meets the majority of core job requirements with verifiable resume evidence.",
      };
    }
    if (s >= 50) {
      return {
        label: "Moderate Fit",
        badgeVariant: "border-warning/40 bg-warning-soft text-warning",
        desc: "Core capabilities match, but key specialized tools or cloud credentials require review.",
      };
    }
    return {
      label: "Needs Optimization",
      badgeVariant: "border-destructive/40 bg-danger-soft text-destructive",
      desc: "Several primary requirements in the job description are unevidenced in the resume text.",
    };
  };

  const verdict = getScoreVerdict(score);

  return (
    <div className="surface-card p-6 md:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Score Gauge & Status */}
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-3 pb-4 lg:pb-0 lg:border-r border-border">
          <div className="flex items-center gap-2">
            <span className="text-label">ATS Alignment Score</span>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              Sample Score
            </Badge>
          </div>

          <ScoreRing score={score} size={156} />

          <div className="space-y-1">
            <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1", verdict.badgeVariant)}>
              <Sparkles className="size-3 mr-1" />
              {verdict.label} ({score}/100)
            </Badge>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {verdict.desc}
            </p>
          </div>
        </div>

        {/* Right: Explanation & Category Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-1.5">
            <h3 className="text-section flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Score Meaning & Assessment
            </h3>
            {explanation ? (
              <p className="text-sm leading-relaxed text-foreground font-normal">
                {explanation}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Algorithmic fit score determined by comparing resume evidence against stated job requirements.
              </p>
            )}
          </div>

          {/* Breakdown Bars (Supported by Data) */}
          {breakdown && breakdown.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-label">Competency Breakdown</span>
              <div className="space-y-3">
                {breakdown.map((item) => {
                  const pct = Math.round((item.score / item.max) * 100);
                  const toneColor = pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive";
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{item.category}</span>
                        <span className="font-mono font-medium text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", toneColor)}
                          initial={{ width: reduce ? `${pct}%` : 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Safety Disclaimer */}
      <div className="pt-4 border-t border-border flex items-start gap-2.5 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-medium text-foreground">Transparent Scoring Guide: </span>
          Scores reflect explicit keyword alignment and verifiable evidence density found in your resume text.
          This score is an informational tool for ATS preparation and does not guarantee employer interview decisions.
        </p>
      </div>
    </div>
  );
}
