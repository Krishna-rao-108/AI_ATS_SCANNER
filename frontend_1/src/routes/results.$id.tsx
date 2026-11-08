import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, FileSearch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { analysisQuery } from "@/lib/api/services";
import type {
  Analysis,
  CurrentSkillItem,
  MatchedSkillItem,
  MissingSkillItem,
} from "@/lib/api/types";
import { MatchSummaryHero } from "@/components/results/MatchSummaryHero";
import { SkillsComparison } from "@/components/results/SkillsComparison";
import { ActionableRecommendations } from "@/components/results/ActionableRecommendations";
import { SupportingDetails } from "@/components/results/SupportingDetails";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Analysis Results — ATS Analyzer" },
      { name: "description", content: "Targeted skill comparison, match score, and recommendations for your resume." },
      { property: "og:title", content: "Analysis Results — ATS Analyzer" },
      { property: "og:description", content: "Targeted skill comparison, match score, and recommendations for your resume." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const q = useQuery(analysisQuery(id));

  return (
    <AppShell title="Analysis Results">
      {q.isLoading && (
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {q.isError && (
        <div className="mx-auto max-w-5xl surface-card flex items-center gap-3 p-6 text-sm text-destructive border-destructive/30">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(q.error as Error).message}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => q.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {q.data && !q.data.data && (
        <div className="mx-auto max-w-5xl surface-card p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto text-muted-foreground">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Analysis Not Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This analysis ID could not be located in your local session store.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/analyze">Run New Scan</Link>
          </Button>
        </div>
      )}

      {q.data?.data && <ResultView analysis={q.data.data} />}
    </AppShell>
  );
}

function ResultView({ analysis }: { analysis: Analysis }) {
  const reduce = useReducedMotion();

  // Construct from real backend analysis fields without any demo data dependency
  const currentSkills: CurrentSkillItem[] =
    analysis.detailed_current_skills && analysis.detailed_current_skills.length > 0
      ? analysis.detailed_current_skills
      : (analysis.matched_skills || []).map((s) => ({
          name: s,
          category: "Identified Skills",
          verified: true,
        }));

  const matchedSkills: MatchedSkillItem[] =
    analysis.detailed_matched_skills && analysis.detailed_matched_skills.length > 0
      ? analysis.detailed_matched_skills
      : (analysis.matched_skills || []).map((s) => ({
          name: s,
          category: "Identified Skills",
          section: "Resume Content",
          evidence: `Verified in candidate resume: ${s}`,
          match_explanation: "Identified demonstrable competency",
        }));

  const missingSkills: MissingSkillItem[] =
    analysis.detailed_missing_skills && analysis.detailed_missing_skills.length > 0
      ? analysis.detailed_missing_skills
      : (analysis.missing_skills || []).map((s, i) => ({
          name: s,
          category: "Improvement Focus",
          priority: i === 0 ? "critical" : "high",
          why_it_matters: "Identified as an area for improvement or requirement gap",
          suggestion: s,
          status: "missing",
        }));

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.25, ease: "easeOut" as const },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* 1. FIRST: Match Summary (Role, Score, Plain-English Explanation, Primary CTAs) */}
      <motion.section {...fade(0)}>
        <MatchSummaryHero analysis={analysis} />
      </motion.section>

      {/* 2. SECOND: Skills Comparison (Clean 3-Category Switcher, Editorial Rows) */}
      <motion.section {...fade(0.06)}>
        <SkillsComparison
          currentSkills={currentSkills}
          matchedSkills={matchedSkills}
          missingSkills={missingSkills}
          analysisType={analysis.analysis_type}
        />
      </motion.section>


      {/* 3. THIRD: Actionable Recommendations (Top 3 Priority Actions with Expandable Remainder) */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <motion.section {...fade(0.12)}>
          <ActionableRecommendations recommendations={analysis.recommendations} />
        </motion.section>
      )}

      {/* 4. FOURTH: Supporting Details (Competency Breakdown, Strengths, Keywords, Raw Text) */}
      <motion.section {...fade(0.18)}>
        <SupportingDetails
          strengths={analysis.detailed_strengths ?? analysis.strengths}
          breakdown={analysis.score_breakdown}
          keywords={analysis.keywords}
          resumeText={analysis.resume_text}
        />
      </motion.section>

      {/* Footer Navigation: Quiet and Intentional */}
      <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="size-3.5" /> Back to Overview
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/analyze">
              <FileSearch className="size-3.5 mr-1.5" />
              Scan Another Resume
            </Link>
          </Button>

          <Button asChild variant="default" size="sm" className="gap-1.5 shadow-lift">
            <Link to="/tailor">
              <Sparkles className="size-3.5" />
              Tailor Resume
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
