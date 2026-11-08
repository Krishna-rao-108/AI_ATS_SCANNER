import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ActionableRecommendationsProps {
  recommendations: Recommendation[];
}

export function ActionableRecommendations({
  recommendations,
}: ActionableRecommendationsProps) {
  const [showAll, setShowAll] = useState(false);

  if (!recommendations || recommendations.length === 0) return null;

  const visibleRecs = showAll ? recommendations : recommendations.slice(0, 3);
  const remainingCount = recommendations.length - 3;

  const priorityColor: Record<Recommendation["priority"], string> = {
    high: "text-destructive border-destructive/30 bg-danger-soft",
    medium: "text-warning border-warning/30 bg-warning-soft",
    low: "text-muted-foreground border-border bg-muted/60",
  };

  return (
    <div className="surface-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-border">
        <div>
          <h2 className="text-section text-foreground">Actionable Recommendations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Targeted adjustments to improve ATS alignment and recruiter impact for this role.
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          Showing {visibleRecs.length} of {recommendations.length} recommendations
        </span>
      </div>

      {/* Editorial Numbered Recommendations List */}
      <div className="space-y-4">
        {visibleRecs.map((rec, idx) => (
          <div
            key={rec.title}
            className="p-5 rounded-xl border border-border/80 bg-muted/15 space-y-3 transition-colors hover:border-border"
          >
            {/* Title Row */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  0{idx + 1}
                </span>
                <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] uppercase font-semibold px-2 py-0.2", priorityColor[rec.priority])}
                >
                  {rec.priority} priority
                </Badge>
              </div>

              {rec.section && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  Target section: {rec.section}
                </span>
              )}
            </div>

            {/* Context & Suggestion in Clean Editorial Style */}
            <div className="text-xs space-y-2 text-foreground/90 leading-relaxed pl-6">
              <p className="text-muted-foreground">
                <strong className="text-foreground font-semibold">Why it matters: </strong>
                {rec.why_it_matters ?? rec.explanation}
              </p>

              <div className="p-3 rounded-lg bg-card border border-border/70 text-foreground">
                <strong className="text-primary font-semibold block mb-0.5">Recommended action:</strong>
                {rec.suggestion}
              </div>
            </div>

            {/* Next Action Link */}
            <div className="pl-6 pt-1 flex items-center justify-between">
              {rec.next_step ? (
                <p className="text-[11px] text-muted-foreground font-medium">
                  {rec.next_step}
                </p>
              ) : <div />}

              <Button asChild size="sm" variant="ghost" className="text-xs font-medium text-primary hover:text-primary gap-1 h-7">
                <Link to="/tailor">
                  <Sparkles className="size-3" /> Apply in Tailor
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Remaining Recommendations */}
      {remainingCount > 0 && (
        <div className="pt-2 text-center border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            {showAll ? (
              <>
                <ChevronUp className="size-3.5" /> Show top 3 only
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" /> View {remainingCount} more recommendations
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
