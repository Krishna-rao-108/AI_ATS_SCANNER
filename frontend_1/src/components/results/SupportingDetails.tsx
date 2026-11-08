import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Key,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  KeywordInsight,
  ScoreBreakdownItem,
  StrengthItem,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface SupportingDetailsProps {
  strengths: (string | StrengthItem)[];
  breakdown?: ScoreBreakdownItem[] | undefined;
  keywords?: KeywordInsight[] | undefined;
  resumeText?: string | null | undefined;
}


export function SupportingDetails({
  strengths,
  breakdown,
  keywords,
  resumeText,
}: SupportingDetailsProps) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "strengths" | "keywords" | "text">("breakdown");

  return (
    <div className="surface-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-border">
        <div>
          <h2 className="text-section text-foreground">Analysis Details & Evidence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Secondary audit telemetry, scoring breakdown, verified strengths, and raw extracted text.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/80 self-start sm:self-auto overflow-x-auto">
          {breakdown && breakdown.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("breakdown")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === "breakdown"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Scoring Breakdown
            </button>
          )}

          {strengths && strengths.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("strengths")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === "strengths"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Strengths ({strengths.length})
            </button>
          )}

          {keywords && keywords.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("keywords")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === "keywords"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Keywords ({keywords.length})
            </button>
          )}

          {resumeText && (
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === "text"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Raw Resume
            </button>
          )}
        </div>
      </div>

      {/* 1. SCORING BREAKDOWN */}
      {activeTab === "breakdown" && breakdown && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breakdown.map((item) => {
              const pct = Math.round((item.score / item.max) * 100);
              const tone = pct >= 75 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";
              const barColor = pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive";

              return (
                <div key={item.category} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.category}</span>
                    <span className={cn("font-mono font-bold", tone)}>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground italic pt-2">
            * Scores reflect explicit evidence density from candidate resume text against job requirements.
          </p>
        </div>
      )}

      {/* 2. PROFILE STRENGTHS */}
      {activeTab === "strengths" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strengths.map((item, idx) => {
            const isObj = typeof item === "object" && item !== null;
            const title = isObj ? item.title : `Strength #${idx + 1}`;
            const explanation = isObj ? item.explanation : item;
            const section = isObj ? item.section : null;
            const evidence = isObj ? item.evidence : null;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                  <h3 className="font-bold text-foreground">{title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {explanation}
                </p>
                {evidence && (
                  <div className="pl-6 pt-1 text-[11px] text-muted-foreground">
                    <p className="font-mono bg-card p-2 rounded border border-border/60 italic text-foreground/80">
                      "{evidence}"
                    </p>
                    {section && (
                      <span className="text-[10px] text-muted-foreground font-mono block mt-1">
                        Found in: {section}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. KEYWORDS TELEMETRY */}
      {activeTab === "keywords" && keywords && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Parsed Keyword</th>
                  <th className="py-2.5 px-4">Resume Citation</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Suggested Placement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keywords.map((k) => (
                  <tr key={k.keyword} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-foreground">
                      {k.keyword}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground max-w-sm">
                      {k.evidence ? (
                        <span className="italic font-mono text-[11px] text-foreground/90">
                          "{k.evidence}"
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Not evidenced in text</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {k.present ? (
                        <span className="inline-flex items-center gap-1 text-success font-semibold text-[11px]">
                          <Check className="size-3" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-warning font-semibold text-[11px]">
                          <X className="size-3" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                      {k.suggested_placement ?? "Supported by resume facts"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RAW RESUME TEXT */}
      {activeTab === "text" && resumeText && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Verbatim extracted text parsed from your uploaded resume.
          </p>
          <pre className="p-4 rounded-lg bg-muted/40 border border-border font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {resumeText}
          </pre>
        </div>
      )}
    </div>
  );
}
