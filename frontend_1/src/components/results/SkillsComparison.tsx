import { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  CurrentSkillItem,
  MatchedSkillItem,
  MissingSkillItem,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface SkillsComparisonProps {
  currentSkills: CurrentSkillItem[];
  matchedSkills: MatchedSkillItem[];
  missingSkills: MissingSkillItem[];
  analysisType?: string | undefined;
}

export function SkillsComparison({
  currentSkills,
  matchedSkills,
  missingSkills,
  analysisType,
}: SkillsComparisonProps) {
  const isGeneral = analysisType === "general";
  const [activeTab, setActiveTab] = useState<"matched" | "missing" | "current">(
    isGeneral ? "matched" : "matched"
  );
  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const q = search.trim().toLowerCase();

  const filteredMatched = useMemo(() => {
    return matchedSkills.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.evidence.toLowerCase().includes(q)
    );
  }, [matchedSkills, q]);

  const filteredMissing = useMemo(() => {
    return missingSkills.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.why_it_matters.toLowerCase().includes(q)
    );
  }, [missingSkills, q]);

  const groupedCurrent = useMemo(() => {
    const map: Record<string, CurrentSkillItem[]> = {};
    currentSkills.forEach((s) => {
      if (!q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) {
        const cat = s.category;
        if (!map[cat]) map[cat] = [];
        const arr = map[cat];
        if (arr) arr.push(s);
      }
    });
    return map;
  }, [currentSkills, q]);


  const priorityBadge: Record<MissingSkillItem["priority"], string> = {
    critical: "text-destructive border-destructive/30 bg-danger-soft",
    high: "text-destructive border-destructive/30 bg-danger-soft",
    medium: "text-warning border-warning/30 bg-warning-soft",
    low: "text-muted-foreground border-border bg-muted/60",
  };

  return (
    <div className="surface-card p-6 sm:p-8 space-y-6">
      {/* Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-section text-foreground">
            {isGeneral ? "Skills & Quality Audit" : "Skills Comparison"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isGeneral
              ? "Verifiable candidate skills and areas of improvement identified by the quality audit."
              : "Verifiable resume evidence evaluated against target job requirements."}
          </p>
        </div>

        {/* Intuitive 3-Way Segmented Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("matched")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === "matched"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Check className="size-3 text-success" />
            {isGeneral ? "Identified Skills" : "Matched"} ({matchedSkills.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("missing")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === "missing"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AlertCircle className="size-3 text-warning" />
            {isGeneral ? "Improvement Areas" : "Missing"} ({missingSkills.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === "current"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="size-3 text-primary" />
            Resume Skills ({currentSkills.length})
          </button>
        </div>
      </div>

      {/* Optional Search Bar */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground font-normal">
          {activeTab === "matched" &&
            (isGeneral
              ? "Competencies substantiated with verifiable resume evidence."
              : "Skills required by the job that are substantiated with resume evidence.")}
          {activeTab === "missing" &&
            (isGeneral
              ? "Identified weaknesses, formatting feedback, and impact gaps."
              : "Job requirements not found or unverified in your resume.")}
          {activeTab === "current" && "All competencies extracted from your uploaded resume document."}
        </span>
        <div className="relative w-48 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            placeholder="Filter skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-background"
          />
        </div>
      </div>

      {/* TAB 1: Matched Skills (Clean row list, not nested cards) */}
      {activeTab === "matched" && (
        <div className="divide-y divide-border/60">
          {filteredMatched.map((s) => {
            const isExpanded = Boolean(expandedItems[s.name]);
            return (
              <div key={s.name} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full bg-success-soft text-success grid place-items-center shrink-0">
                      <Check className="size-3" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      · {s.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(s.name)}
                    className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                  >
                    {isExpanded ? "Hide evidence" : "View evidence"}
                    {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-7 max-w-3xl">
                  {s.match_explanation}
                </p>

                {isExpanded && (
                  <div className="ml-7 mt-2 p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Resume Evidence ({s.section})
                    </span>
                    <p className="font-mono text-[11px] text-foreground/90 italic">
                      "{s.evidence}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMatched.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No matched skills found matching your filter.
            </p>
          )}
        </div>
      )}

      {/* TAB 2: Missing Skills (Clean editorial list with actionable suggestion) */}
      {activeTab === "missing" && (
        <div className="divide-y divide-border/60">
          {filteredMissing.map((s) => {
            const isExpanded = Boolean(expandedItems[s.name]);
            return (
              <div key={s.name} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full bg-warning-soft text-warning grid place-items-center shrink-0">
                      <AlertTriangle className="size-3" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5", priorityBadge[s.priority])}>
                      {s.priority} priority
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      · {s.status === "needs_review" ? "Unverified" : "Missing"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(s.name)}
                    className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                  >
                    {isExpanded ? "Hide details" : "How to address"}
                    {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-7 max-w-3xl">
                  <span className="font-medium text-foreground">Why it matters: </span>
                  {s.why_it_matters}
                </p>

                {isExpanded && (
                  <div className="ml-7 mt-2 p-3 rounded-lg bg-warning-soft/20 border border-warning/30 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-warning tracking-wider block">
                      Practical Guidance
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {s.suggestion}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMissing.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              All key requirements are represented in the candidate resume!
            </p>
          )}
        </div>
      )}

      {/* TAB 3: All Resume Skills (Grouped by Category) */}
      {activeTab === "current" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {Object.entries(groupedCurrent).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                {category} ({items.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {items.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/40 text-foreground border border-border/80"
                  >
                    <Check className="size-2.5 text-muted-foreground" />
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedCurrent).length === 0 && (
            <p className="text-xs text-muted-foreground italic py-6 text-center col-span-2">
              No skills found matching your filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
