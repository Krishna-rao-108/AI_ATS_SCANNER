import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StrengthItem } from "@/lib/api/types";

interface StrengthsSectionProps {
  strengths: (string | StrengthItem)[];
}

export function StrengthsSection({ strengths }: StrengthsSectionProps) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <div className="surface-card p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-section flex items-center gap-2">
            <ShieldCheck className="size-4 text-success" />
            Evidence-Based Profile Strengths ({strengths.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key competitive advantages substantiated by measurable achievements in your resume.
          </p>
        </div>
        <Badge variant="outline" className="border-success/30 bg-success-soft text-success text-xs">
          Verified Impact
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strengths.map((item, idx) => {
          const isObj = typeof item === "object" && item !== null;
          const title = isObj ? item.title : `Core Competency #${idx + 1}`;
          const explanation = isObj ? item.explanation : item;
          const section = isObj ? item.section : null;
          const evidence = isObj ? item.evidence : null;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-success/30 bg-card space-y-2.5 transition-all hover:border-success/50"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                <h4 className="text-xs font-bold text-foreground leading-snug">{title}</h4>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground pl-6">
                {explanation}
              </p>

              {evidence && (
                <div className="mt-2 pl-6 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <p className="font-mono bg-muted/40 p-2 rounded border border-border/50 italic">
                    "{evidence}"
                  </p>
                  {section && (
                    <span className="text-[10px] text-primary font-mono block mt-1">
                      Source: {section}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
