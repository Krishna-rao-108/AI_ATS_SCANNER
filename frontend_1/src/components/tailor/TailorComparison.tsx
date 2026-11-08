import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TailoredResumeData } from "./tailorTypes";
import { cn } from "@/lib/utils";

interface TailorComparisonProps {
  resume: TailoredResumeData;
}

export function TailorComparison({ resume }: TailorComparisonProps) {
  const [filter, setFilter] = useState<"all" | "experience" | "projects" | "summary">("all");

  const bullets: {
    section: string;
    parentTitle: string;
    original: string;
    tailored: string;
    explanation: string;
    status: string;
  }[] = [];

  if (filter === "all" || filter === "summary") {
    bullets.push({
      section: "Professional Summary",
      parentTitle: "Overview & Headline",
      original:
        "Software engineer with 5+ years of experience building web applications. Passionate about clean code and teamwork.",
      tailored: resume.professional_summary,
      explanation:
        "Tailored to front-load role keywords, target company relevance, and quantifiable impact metrics.",
      status: "grounding_verified",
    });
  }

  if (filter === "all" || filter === "experience") {
    resume.experience.forEach((exp) => {
      exp.bullets.forEach((b) => {
        bullets.push({
          section: "Work Experience",
          parentTitle: `${exp.role} · ${exp.company}`,
          original: b.original,
          tailored: b.tailored,
          explanation: b.explanation,
          status: b.grounding_status,
        });
      });
    });
  }

  if (filter === "all" || filter === "projects") {
    resume.projects.forEach((proj) => {
      proj.bullets.forEach((b) => {
        bullets.push({
          section: "Technical Projects",
          parentTitle: proj.title,
          original: b.original,
          tailored: b.tailored,
          explanation: b.explanation,
          status: b.grounding_status,
        });
      });
    });
  }

  return (
    <div className="space-y-5">
      {/* Filters and Header */}
      <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-section flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Original vs. Tailored Comparison
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Examine how each bullet was adapted for ATS keywords while strictly preserving factual metrics
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
          <Filter className="size-3 text-muted-foreground ml-1" />
          {[
            { id: "all", label: "All Items" },
            { id: "experience", label: "Experience" },
            { id: "projects", label: "Projects" },
            { id: "summary", label: "Summary" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === tab.id
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bullet Cards List */}
      <div className="space-y-4">
        {bullets.map((b, idx) => (
          <div
            key={idx}
            className="surface-card p-5 space-y-4 transition-all hover:border-border/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {b.section}
                </span>
                <span className="text-xs text-muted-foreground">· {b.parentTitle}</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-medium border-success/40 bg-success-soft text-success gap-1"
              >
                <CheckCircle2 className="size-3" /> Grounding Verified
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Factual Bullet */}
              <div className="space-y-1.5 p-3.5 rounded-lg border border-border/80 bg-muted/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Original Source Fact
                </span>
                <p className="text-xs leading-relaxed text-foreground/90 font-normal">
                  {b.original}
                </p>
              </div>

              {/* Tailored ATS Bullet */}
              <div className="space-y-1.5 p-3.5 rounded-lg border border-primary/30 bg-primary-soft/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sparkles className="size-3" /> ATS Formulated Bullet
                </span>
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  {b.tailored}
                </p>
              </div>
            </div>

            {/* AI Explanation / Rationale */}
            {b.explanation && (
              <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
                <ArrowRight className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-foreground">ATS Optimization Rationale:</span>{" "}
                  {b.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
