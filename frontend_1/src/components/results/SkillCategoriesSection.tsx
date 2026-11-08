import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  CurrentSkillItem,
  MatchedSkillItem,
  MissingSkillItem,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface SkillCategoriesSectionProps {
  currentSkills: CurrentSkillItem[];
  matchedSkills: MatchedSkillItem[];
  missingSkills: MissingSkillItem[];
}

export function SkillCategoriesSection({
  currentSkills,
  matchedSkills,
  missingSkills,
}: SkillCategoriesSectionProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "matched" | "missing" | "current">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Extract all distinct categories across the 3 lists
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    currentSkills.forEach((s) => set.add(s.category));
    matchedSkills.forEach((s) => set.add(s.category));
    missingSkills.forEach((s) => set.add(s.category));
    return ["all", ...Array.from(set)];
  }, [currentSkills, matchedSkills, missingSkills]);

  // Filter skills by search query and category
  const query = searchQuery.trim().toLowerCase();

  const filteredCurrent = useMemo(() => {
    return currentSkills.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchQ =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.evidence && s.evidence.toLowerCase().includes(query));
      return matchCat && matchQ;
    });
  }, [currentSkills, selectedCategory, query]);

  const filteredMatched = useMemo(() => {
    return matchedSkills.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchQ =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.evidence.toLowerCase().includes(query) ||
        s.match_explanation.toLowerCase().includes(query);
      return matchCat && matchQ;
    });
  }, [matchedSkills, selectedCategory, query]);

  const filteredMissing = useMemo(() => {
    return missingSkills.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchQ =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.why_it_matters.toLowerCase().includes(query) ||
        s.suggestion.toLowerCase().includes(query);
      return matchCat && matchQ;
    });
  }, [missingSkills, selectedCategory, query]);

  const toggleExpand = (name: string) => {
    setExpandedSkill((prev) => (prev === name ? null : name));
  };

  const priorityStyles: Record<MissingSkillItem["priority"], string> = {
    critical: "border-destructive/40 bg-danger-soft text-destructive",
    high: "border-destructive/30 bg-danger-soft text-destructive",
    medium: "border-warning/40 bg-warning-soft text-warning",
    low: "border-border bg-muted text-muted-foreground",
  };

  return (
    <div className="surface-card p-6 md:p-8 space-y-6">
      {/* Header with Explanatory Context */}
      <div className="space-y-1.5 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-section flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Comprehensive Skills Intelligence
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Structured into three distinct categories: extracted resume skills, verified job matches, and unevidenced requirements.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success-soft text-success border border-success/30 font-medium">
              <Check className="size-3" /> {matchedSkills.length} Matched
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-soft text-warning border border-warning/30 font-medium">
              <AlertCircle className="size-3" /> {missingSkills.length} Missing
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border font-medium">
              <Code2 className="size-3" /> {currentSkills.length} Extracted
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Main Category Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border overflow-x-auto">
          {[
            { id: "overview", label: "Three-Category Overview" },
            { id: "matched", label: `Matched Skills (${filteredMatched.length})` },
            { id: "missing", label: `Missing Requirements (${filteredMissing.length})` },
            { id: "current", label: `Current Resume Skills (${filteredCurrent.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search skills or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Category Filter Pills (if more than 2 categories) */}
      {allCategories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="size-3" /> Category:
          </span>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground hover:text-foreground border-border hover:border-border/80"
              )}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Overview (All 3 side-by-side / stacked) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category B: Matched Skills */}
            <div className="space-y-3 rounded-xl border border-success/30 bg-success-soft/20 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-success/20">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-success flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="size-3.5 text-success" />
                    Matched Skills ({filteredMatched.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Required by job & proven in resume
                  </p>
                </div>
                <Badge variant="outline" className="border-success/40 bg-success-soft text-success text-[10px]">
                  Verified Match
                </Badge>
              </div>

              <div className="space-y-2 pt-1">
                {filteredMatched.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => toggleExpand(s.name)}
                    className="p-3 rounded-lg border border-success/30 bg-card hover:border-success/60 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Check className="size-3 text-success shrink-0" />
                        {s.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {s.match_explanation}
                    </p>
                    {expandedSkill === s.name && (
                      <div className="pt-2 border-t border-border/60 text-xs space-y-1.5">
                        <p className="text-foreground text-[11px] leading-relaxed">
                          <strong className="text-success">Why Matched:</strong> {s.match_explanation}
                        </p>
                        <p className="p-2 rounded bg-muted/40 border border-border/40 text-[11px] text-muted-foreground font-mono">
                          <strong className="text-foreground font-sans">Resume Evidence ({s.section}):</strong> "{s.evidence}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {filteredMatched.length === 0 && (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No matched skills found matching filters.
                  </p>
                )}
              </div>
            </div>

            {/* Category C: Missing Skills */}
            <div className="space-y-3 rounded-xl border border-warning/40 bg-warning-soft/20 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-warning/20">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-warning flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="size-3.5 text-warning" />
                    Missing Skills ({filteredMissing.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Required by job but not evidenced
                  </p>
                </div>
                <Badge variant="outline" className="border-warning/40 bg-warning-soft text-warning text-[10px]">
                  Needs Attention
                </Badge>
              </div>

              <div className="space-y-2 pt-1">
                {filteredMissing.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => toggleExpand(s.name)}
                    className="p-3 rounded-lg border border-warning/30 bg-card hover:border-warning/60 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertCircle className="size-3 text-warning shrink-0" />
                        {s.name}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", priorityStyles[s.priority])}>
                        {s.priority} priority
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {s.why_it_matters}
                    </p>
                    {expandedSkill === s.name && (
                      <div className="pt-2 border-t border-border/60 text-xs space-y-1.5">
                        <p className="text-foreground text-[11px] leading-relaxed">
                          <strong className="text-warning">Why It Matters:</strong> {s.why_it_matters}
                        </p>
                        <p className="p-2 rounded bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
                          <strong className="text-foreground">Suggested Action:</strong> {s.suggestion}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          Status: {s.status === "needs_review" ? "Unverified / Needs Review" : "Missing from resume"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {filteredMissing.length === 0 && (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No missing skills matching filter.
                  </p>
                )}
              </div>
            </div>

            {/* Category A: Current Resume Skills */}
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Code2 className="size-3.5 text-primary" />
                    Current Skills ({filteredCurrent.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    All competencies found in resume
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Extracted Facts
                </Badge>
              </div>

              <div className="space-y-2 pt-1 max-h-[500px] overflow-y-auto pr-1">
                {filteredCurrent.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => toggleExpand(s.name)}
                    className="p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{s.category}</span>
                    </div>
                    {expandedSkill === s.name && s.evidence && (
                      <div className="pt-2 border-t border-border/60 text-[11px] space-y-1">
                        <span className="font-semibold text-foreground">Resume Section: {s.section}</span>
                        <p className="text-muted-foreground italic">"{s.evidence}"</p>
                      </div>
                    )}
                  </div>
                ))}
                {filteredCurrent.length === 0 && (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No skills found matching filter.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Detailed Matched Skills */}
      {activeTab === "matched" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Confirmed skills supported by direct evidence in the resume that correspond to requirements in the job description.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatched.map((s) => (
              <div key={s.name} className="surface-card p-4 space-y-2.5 border-l-4 border-l-success">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-success" />
                    {s.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success-soft">
                    {s.category}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-foreground leading-relaxed">
                    <span className="font-semibold text-success">Match Rationale: </span>
                    {s.match_explanation}
                  </p>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground block mb-0.5">
                      Resume Evidence ({s.section}):
                    </span>
                    "{s.evidence}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Detailed Missing Skills */}
      {activeTab === "missing" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Skills required by the target job description that are unevidenced or missing from the candidate's resume.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMissing.map((s) => (
              <div key={s.name} className="surface-card p-4 space-y-2.5 border-l-4 border-l-warning">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-warning" />
                    {s.name}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-semibold", priorityStyles[s.priority])}>
                    {s.priority} Priority Gap
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="text-foreground leading-relaxed">
                    <span className="font-semibold text-warning">Why It Matters: </span>
                    {s.why_it_matters}
                  </p>
                  <p className="text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="font-semibold text-foreground block mb-0.5">Actionable Suggestion:</span>
                    {s.suggestion}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                    <span>Category: {s.category}</span>
                    <span className="font-medium text-warning">
                      {s.status === "needs_review" ? "Unverified / Needs Review" : "Confirmed Missing"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Detailed Current Resume Skills */}
      {activeTab === "current" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            All skills and competencies extracted from the candidate resume.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCurrent.map((s) => (
              <div key={s.name} className="surface-card p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                    {s.category}
                  </Badge>
                </div>
                {s.evidence && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {s.evidence}
                  </p>
                )}
                {s.section && (
                  <span className="text-[10px] text-primary font-mono block pt-0.5">
                    Found in: {s.section}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
