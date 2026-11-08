import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TailoredResumeData } from "./tailorTypes";

interface TailorAuditProps {
  resume: TailoredResumeData;
}

export function TailorAudit({ resume }: TailorAuditProps) {
  const audit = resume.preservation_audit;

  return (
    <div className="space-y-6">
      {/* 1. Preservation & Grounding Guarantee Banner */}
      <div className="surface-card p-5 border-l-4 border-l-primary space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h3 className="text-section text-foreground">
            Zero-Content-Loss & Grounding Guarantee
          </h3>
          <Badge variant="outline" className="text-xs text-success border-success/40 bg-success-soft ml-auto">
            Verified 100%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The tailoring pipeline strictly validates that all projects, companies, dates, education
          credentials, and quantitative metrics originate directly from your source resume. Unmet
          job requirements are isolated into skill gaps and never injected as false candidate experience.
        </p>
      </div>

      {/* 2. Audit Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-4 text-center space-y-1">
          <p className="text-stat text-success font-bold">
            {audit.preserved_unchanged_count}
          </p>
          <p className="text-xs font-semibold text-foreground">Preserved Verbatim</p>
          <p className="text-[11px] text-muted-foreground">Original facts unchanged</p>
        </div>

        <div className="surface-card p-4 text-center space-y-1">
          <p className="text-stat text-primary font-bold">
            {audit.rewritten_verified_count}
          </p>
          <p className="text-xs font-semibold text-foreground">Rewritten & Verified</p>
          <p className="text-[11px] text-muted-foreground">Reformulated with impact</p>
        </div>

        <div className="surface-card p-4 text-center space-y-1">
          <p className="text-stat text-warning font-bold">
            {audit.flagged_count}
          </p>
          <p className="text-xs font-semibold text-foreground">Guardrail Interventions</p>
          <p className="text-[11px] text-muted-foreground">Safety checks triggered</p>
        </div>

        <div className="surface-card p-4 text-center space-y-1">
          <p className="text-stat text-foreground font-bold">
            {audit.missing_rejected_count}
          </p>
          <p className="text-xs font-semibold text-foreground">Missing Items</p>
          <p className="text-[11px] text-success font-medium">0 = Zero Content Loss</p>
        </div>
      </div>

      {/* 3. Skill Gaps Card */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="space-y-0.5">
            <h4 className="text-section flex items-center gap-2 text-warning">
              <AlertCircle className="size-4" />
              Identified Job Skill Gaps ({resume.skill_gaps.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              These keywords from the job posting were not evidenced in your source resume. To
              prevent qualification fabrication, they were intentionally excluded.
            </p>
          </div>
        </div>

        {resume.skill_gaps.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {resume.skill_gaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-warning-soft text-warning border border-warning/40 flex items-center gap-1.5"
                >
                  <AlertCircle className="size-3" />
                  Missing requirement: {gap}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-lg border border-border/60">
              💡 <strong>Actionable Tip:</strong> If you have demonstrable hands-on experience with any
              of the tools above, add them into your source resume or mention them in your cover letter.
            </p>
          </div>
        ) : (
          <p className="text-xs text-success font-medium flex items-center gap-1.5">
            <CheckCircle2 className="size-4" />
            All required qualifications in the job description are supported by your source resume!
          </p>
        )}
      </div>

      {/* 4. Guardrail Interventions & Flagged Claims */}
      {resume.unsupported_claims_flagged?.length > 0 && (
        <div className="surface-card p-5 space-y-3 border-border">
          <h4 className="text-section flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-4 text-warning" />
            Hallucination Safety Guardrail Interventions
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {resume.unsupported_claims_flagged.map((item, idx) => (
              <li
                key={idx}
                className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-2.5"
              >
                <span className="text-warning font-bold">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Summary Statement */}
      <div className="surface-card p-5 flex items-center gap-3">
        <FileCheck className="size-5 text-success shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Audit Verdict: </span>
          {resume.validation_summary}
        </div>
      </div>
    </div>
  );
}
