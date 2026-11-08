import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) return null;

  const priorityStyles: Record<Recommendation["priority"], string> = {
    high: "border-destructive/40 bg-danger-soft text-destructive",
    medium: "border-warning/40 bg-warning-soft text-warning",
    low: "border-border bg-muted text-muted-foreground",
  };

  return (
    <div className="surface-card p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-section flex items-center gap-2">
            <Lightbulb className="size-4 text-warning" />
            Actionable Next Steps & Recommendations ({recommendations.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Specific improvements tailored to this role. Never claim unearned skills or engage in keyword stuffing.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((r, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-border bg-card space-y-3.5 transition-all hover:border-border/80"
          >
            {/* Header: Priority, Title, Section Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs font-semibold uppercase tracking-wider", priorityStyles[r.priority])}>
                  {r.priority} Priority
                </Badge>
                <h4 className="text-sm font-bold text-foreground">{r.title}</h4>
              </div>
              {r.section && (
                <Badge variant="secondary" className="text-[11px] font-mono">
                  Section: {r.section}
                </Badge>
              )}
            </div>

            {/* 4-Step Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. What needs improvement & 2. Why it matters */}
              <div className="space-y-2.5 p-3.5 rounded-lg border border-border/60 bg-muted/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    1. Observed Requirement Gap
                  </span>
                  <p className="text-foreground leading-relaxed mt-0.5 font-normal">
                    {r.explanation}
                  </p>
                </div>
                {r.why_it_matters && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
                      2. Why It Matters For This Role
                    </span>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">
                      {r.why_it_matters}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Practical Guidance & 4. What candidate can do next */}
              <div className="space-y-2.5 p-3.5 rounded-lg border border-primary/20 bg-primary-soft/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    3. Practical Guidance
                  </span>
                  <p className="text-foreground leading-relaxed mt-0.5">
                    {r.suggestion}
                  </p>
                  {r.next_step && (
                    <div className="mt-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">Action: </span>
                      {r.next_step}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 h-7">
                    <Link to="/tailor">
                      <Sparkles className="size-3 text-primary" />
                      Apply in Resume Tailor
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
