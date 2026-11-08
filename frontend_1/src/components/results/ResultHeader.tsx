import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  FileSearch,
  Mail,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Analysis } from "@/lib/api/types";

interface ResultHeaderProps {
  analysis: Analysis;
}

export function ResultHeader({ analysis }: ResultHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const lines = [
      `# ATS Analysis Report: ${analysis.job_title ?? "Software Engineer"}`,
      `**Resume:** ${analysis.resume_filename} | **Date:** ${new Date(analysis.created_at).toLocaleDateString()}`,
      `**Match Score:** ${analysis.match_score}/100`,
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
    toast.success("Analysis report summary copied to clipboard as Markdown!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" /> Back to Overview
        </Link>

        <Badge variant="outline" className="text-[11px] font-mono border-warning/40 bg-warning-soft text-warning">
          Demonstration Mode
        </Badge>
      </div>

      {/* Main Title Row with Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title truncate">
              {analysis.job_title ?? "Analysis Results"}
            </h1>
            <Badge variant="secondary" className="text-xs font-medium">
              ID: {analysis.id}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {analysis.resume_filename} · Analyzed {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="default" className="gap-1.5 shadow-lift">
            <Link to="/tailor">
              <Sparkles className="size-3.5" />
              Tailor Resume
            </Link>
          </Button>

          <Button asChild size="sm" variant="secondary" className="gap-1.5">
            <Link to="/cover-letters">
              <Mail className="size-3.5" />
              Cover Letter
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopySummary}
            className="gap-1.5"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Report"}
          </Button>

          <Button asChild size="sm" variant="ghost">
            <Link to="/analyze">
              <FileSearch className="size-3.5 mr-1" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
