import { Check, HelpCircle, Key, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KeywordInsight } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface KeywordAnalysisProps {
  keywords: KeywordInsight[];
}

export function KeywordAnalysis({ keywords }: KeywordAnalysisProps) {
  if (!keywords || keywords.length === 0) return null;

  const presentCount = keywords.filter((k) => k.present).length;
  const coveragePercent = Math.round((presentCount / keywords.length) * 100);

  return (
    <div className="surface-card p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-section flex items-center gap-2">
            <Key className="size-4 text-primary" />
            Job Description Keyword Telemetry
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exact terminology parsed from target job requirements and verified against resume sentences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            Coverage: {coveragePercent}%
          </span>
          <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
            {presentCount} of {keywords.length} present
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-2.5 px-4">Target Keyword</th>
                <th className="py-2.5 px-4">Resume Evidence</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Placement Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keywords.map((k) => (
                <tr key={k.keyword} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {k.keyword}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-sm">
                    {k.evidence ? (
                      <span className="italic font-mono text-[11px] text-foreground">
                        "{k.evidence}"
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">No direct citation found</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {k.present ? (
                      <span className="inline-flex items-center gap-1 text-success font-semibold">
                        <Check className="size-3.5" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning font-semibold">
                        <X className="size-3.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {k.suggested_placement ? (
                      <span className="text-[11px] text-primary font-medium">
                        {k.suggested_placement}
                      </span>
                    ) : (
                      <span className="text-[11px] text-success">Supported by resume facts</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
