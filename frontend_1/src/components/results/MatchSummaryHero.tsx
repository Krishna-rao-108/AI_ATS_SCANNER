import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  FileSearch,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/app/ScoreRing";
import { toast } from "sonner";
import type { Analysis } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface MatchSummaryHeroProps {
  analysis: Analysis;
}

export function MatchSummaryHero({ analysis }: MatchSummaryHeroProps) {
  const [copied, setCopied] = useState(false);
  const score = analysis.match_score ?? 74;

  const handleCopySummary = () => {
    const lines = [
      `# ATS Analysis Report: ${analysis.job_title ?? "Software Engineer"}`,
      `**Resume:** ${analysis.resume_filename} | **Date:** ${new Date(analysis.created_at).toLocaleDateString()}`,
      `**Match Score:** ${score}/100`,
      `**Summary:** ${analysis.score_explanation ?? "Candidate analysis completed."}`,
      "",
      `## Matched Skills (${analysis.matched_skills.length})`,
      analysis.matched_skills.map((s) => `- ${s}`).join("\n"),
      "",
      `## Missing Requirements (${analysis.missing_skills.length})`,
      analysis.missing_skills.map((s) => `- ${s}`).join("\n"),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Analysis summary copied to clipboard as Markdown");
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreTier =
    score >= 75
      ? { label: "Strong Fit", tone: "text-success border-success/30 bg-success-soft" }
      : score >= 50
        ? { label: "Moderate Fit", tone: "text-warning border-warning/30 bg-warning-soft" }
        : { label: "Needs Review", tone: "text-destructive border-destructive/30 bg-danger-soft" };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between text-xs">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" /> Back to Overview
        </Link>
        <span className="text-[11px] text-muted-foreground/80 font-mono">
          {analysis.analysis_type === "general" ? "General Quality Audit" : "ATS Job Match"} · ID: #{analysis.id}
        </span>
      </div>

      {/* Main Hero Card: Unified Composition */}
      <div className="surface-card p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Job Context, Explanation & Actions */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {analysis.analysis_type === "general"
                    ? "General Resume Quality Check"
                    : (analysis.job_title ?? "Analysis Results")}
                </h1>
                <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", scoreTier.tone)}>
                  {scoreTier.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {analysis.resume_filename} · Evaluated {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Plain-English Result Explanation */}
            <p className="text-sm leading-relaxed text-foreground/90 max-w-2xl font-normal">
              {analysis.score_explanation ??
                (analysis.analysis_type === "general"
                  ? "Your resume has been audited for structural clarity, demonstrable skills, and impact. Review the identified strengths and improvement recommendations below."
                  : "Your resume demonstrates strong technical alignment with the core requirements. Addressing cloud deployment and specific API tooling will further optimize your ranking.")}
            </p>

            {/* Primary & Secondary Actions with Clear Hierarchy */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Button asChild size="default" className="gap-2 shadow-lift">
                <Link to="/tailor">
                  <Sparkles className="size-4" />
                  Tailor Resume
                </Link>
              </Button>

              <Button asChild variant="outline" size="default" className="gap-2">
                <Link to="/cover-letters">
                  <Mail className="size-4" />
                  Cover Letter
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySummary}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 ml-auto sm:ml-0"
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy summary"}
              </Button>

              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                <Link to="/analyze">
                  <FileSearch className="size-3.5 mr-1" />
                  New scan
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Prominent Score Display */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/60 text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {analysis.analysis_type === "general" ? "Resume Quality Score" : "ATS Match Score"}
            </span>
            <ScoreRing score={score} size={132} />
            <p className="text-[11px] text-muted-foreground max-w-[200px] leading-tight">
              {analysis.analysis_type === "general"
                ? "Based on structural clarity, formatting, and verifiable skills"
                : "Based on verified qualifications in candidate resume text"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
