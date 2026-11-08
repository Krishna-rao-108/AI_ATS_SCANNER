import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, FileSearch, Mail, Sparkles, Upload, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { analysesQuery, statsQueryOptions } from "@/lib/api/services";
import { scoreTone } from "@/components/app/ScoreRing";
import { cn } from "@/lib/utils";
import hero from "@/assets/hero-docs.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — ATS Analyzer" },
      { name: "description", content: "Your resume analysis workspace: recent results and quick actions." },
      { property: "og:title", content: "Overview — ATS Analyzer" },
      { property: "og:description", content: "Your resume analysis workspace: recent results and quick actions." },
    ],
  }),
  component: Overview,
});

const fade = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.3 },
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Overview() {
  const stats = useQuery(statsQueryOptions);
  const analyses = useQuery(analysesQuery);

  const statItems = stats.data
    ? [
        { label: "Resumes", value: stats.data.data.total_resumes },
        { label: "Analyses", value: stats.data.data.total_analyses },
        { label: "Avg. match", value: stats.data.data.average_match_score, suffix: "%" },
      ].filter((s) => s.value != null)
    : [];

  return (
    <AppShell title="Overview">
      <motion.section {...fade(0)} className="surface-card relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 max-w-lg">
          <p className="text-label">{greeting()}</p>
          <h2 className="text-page-title mt-2">See how your resume reads to the role you want.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Upload a resume, paste a job description, and get a clear, honest breakdown of matches,
            gaps, and practical next steps.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2 shadow-lift">
            <Link to="/analyze">
              <FileSearch className="size-4" /> Analyze a resume
            </Link>
          </Button>
        </div>
        <img
          src={hero}
          alt=""
          width={1024}
          height={768}
          className="pointer-events-none absolute -right-10 top-1/2 hidden w-[420px] -translate-y-1/2 opacity-90 mix-blend-multiply dark:opacity-60 dark:mix-blend-luminosity lg:block"
        />
      </motion.section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <motion.div {...fade(1)}>
          <Link to="/analyze" className="surface-card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <Upload className="size-5 text-primary" />
            <p className="text-section mt-4">Analyze against a job</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or DOCX and compare.</p>
            <ArrowRight className="mt-auto size-4 self-end pt-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </motion.div>
        {[
          { icon: Sparkles, t: "Tailor a resume", d: "Adapt wording for a specific role." },
          { icon: Mail, t: "Write a cover letter", d: "Grounded in your real experience." },
        ].map(({ icon: Icon, t, d }, i) => (
          <motion.div {...fade(2 + i)} key={t} className="surface-card flex flex-col p-5 opacity-70">
            <Icon className="size-5 text-muted-foreground" />
            <p className="text-section mt-4">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            <span className="mt-4 self-start rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
          </motion.div>
        ))}
      </div>

      {statItems.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {statItems.map((s) => (
            <div key={s.label} className="surface-card p-5">
              <p className="text-label">{s.label}</p>
              <p className="text-stat mt-2">
                {s.value}
                {s.suffix}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h3 className="text-section mb-3">Recent analyses</h3>
        <div className="surface-card divide-y divide-border">
          {analyses.isLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-4 w-12" />
              </div>
            ))}
          {analyses.isError && (
            <div className="flex items-center gap-2 p-5 text-sm text-destructive">
              <AlertCircle className="size-4" /> {(analyses.error as Error).message}
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => analyses.refetch()}>Retry</Button>
            </div>
          )}
          {analyses.data && analyses.data.data.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium">No analyses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Your results will appear here after your first analysis.</p>
            </div>
          )}
          {analyses.data?.data.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              to="/results/$id"
              params={{ id: a.id }}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.resume_filename}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.job_title ?? "Untitled role"} · {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              {a.match_score != null && (
                <span className={cn("font-mono text-sm font-medium tabular-nums", scoreTone(a.match_score))}>
                  {a.match_score}
                </span>
              )}
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
