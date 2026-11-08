import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCEPTED_EXT,
  MAX_FILE_BYTES,
  MIN_JD_CHARS,
  atsApi,
  resumesQuery,
} from "@/lib/api/services";
import type { Resume } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Resume — ATS Analyzer" },
      {
        name: "description",
        content:
          "Upload your resume or select an existing one to run a general quality audit or match against a job description.",
      },
      { property: "og:title", content: "Analyze Resume — ATS Analyzer" },
      {
        property: "og:description",
        content:
          "Upload your resume or select an existing one to run a general quality audit or match against a job description.",
      },
    ],
  }),
  component: Analyze,
});

const fmtSize = (b: number) =>
  b === 0
    ? ""
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)} KB`
      : `${(b / 1024 / 1024).toFixed(1)} MB`;
const MIN_JD = MIN_JD_CHARS;

function Analyze() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Analysis Mode: Job Match (with JD) vs General Check (without JD)
  const [analysisMode, setAnalysisMode] = useState<"job_match" | "general">("job_match");

  // Resume Selection: Upload fresh vs Select existing
  const [sourceMode, setSourceMode] = useState<"upload" | "existing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null);
  const [existingResume, setExistingResume] = useState<Resume | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [jd, setJd] = useState("");

  const savedResumes = useQuery(resumesQuery);

  const upload = useMutation({
    mutationFn: (f: File) => atsApi.uploadResume(f),
    onSuccess: (r) => {
      setUploadedResume(r.data);
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
  });

  const activeResume = sourceMode === "upload" ? uploadedResume : existingResume;

  const analyze = useMutation({
    mutationFn: () =>
      atsApi.analyze(
        activeResume!,
        analysisMode === "job_match" ? jd.trim() : undefined,
        analysisMode,
      ),
    onSuccess: (r) => {
      qc.invalidateQueries();
      navigate({ to: "/results/$id", params: { id: r.data.id } });
    },
  });

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFileError(null);
    setUploadedResume(null);
    upload.reset();
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) return setFileError("Please upload a PDF or DOCX file.");
    if (f.size > MAX_FILE_BYTES) return setFileError(`File is larger than ${fmtSize(MAX_FILE_BYTES)}.`);
    if (f.size === 0) return setFileError("This file appears to be empty.");
    setFile(f);
    upload.mutate(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files[0]);
  };

  const clear = () => {
    setFile(null);
    setUploadedResume(null);
    upload.reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const jdOk = jd.trim().length >= MIN_JD;
  const canSubmit =
    analysisMode === "job_match"
      ? !!activeResume && jdOk && !analyze.isPending
      : !!activeResume && !analyze.isPending;

  return (
    <AppShell title="Analyze Resume">
      <div className="max-w-3xl">
        <h2 className="text-page-title">Analyze a resume</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {analysisMode === "job_match"
            ? "Two steps: your resume, then the job you're targeting."
            : "Evaluate your resume's ATS formatting, structure, clarity, and demonstrable skills."}
        </p>

        {/* Analysis Mode Toggle */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAnalysisMode("job_match")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
              analysisMode === "job_match"
                ? "border-primary bg-primary-soft text-primary shadow-xs font-semibold"
                : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <Briefcase className="size-4" />
            <span>Job Match</span>
            <span className="text-xs opacity-75">(with JD)</span>
          </button>

          <button
            type="button"
            onClick={() => setAnalysisMode("general")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
              analysisMode === "general"
                ? "border-primary bg-primary-soft text-primary shadow-xs font-semibold"
                : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <FileCheck className="size-4" />
            <span>General Resume Check</span>
            <span className="text-xs opacity-75">(without JD)</span>
          </button>
        </div>

        {/* STEP 1: RESUME SELECTION */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-section">1. Resume</Label>

            {/* Source Mode Switcher: Upload vs Library */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-xs">
              <button
                type="button"
                onClick={() => setSourceMode("upload")}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  sourceMode === "upload"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Upload New
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("existing")}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  sourceMode === "existing"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Select Existing {savedResumes.data?.data ? `(${savedResumes.data.data.length})` : ""}
              </button>
            </div>
          </div>

          {sourceMode === "upload" ? (
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.button
                  key="drop"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: drag ? 1.01 : 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  className={cn(
                    "mt-3 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    drag ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <UploadCloud className={cn("size-8", drag ? "text-primary" : "text-muted-foreground")} />
                  <p className="mt-3 text-sm font-medium">
                    Drop your resume here, or <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX · up to {fmtSize(MAX_FILE_BYTES)}</p>
                </motion.button>
              ) : (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-card mt-3 flex items-center gap-3 p-4"
                >
                  <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                      {fmtSize(file.size)} ·
                      {upload.isPending && (
                        <>
                          <Loader2 className="size-3 animate-spin" /> Uploading…
                        </>
                      )}
                      {uploadedResume && (
                        <>
                          <CheckCircle2 className="size-3 text-success" /> Ready (ID #{uploadedResume.id})
                        </>
                      )}
                      {upload.isError && <span className="text-destructive">{(upload.error as Error).message}</span>}
                    </p>
                  </div>
                  {upload.isError && (
                    <Button variant="outline" size="sm" onClick={() => upload.mutate(file)}>
                      Retry
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
                    Replace
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clear} aria-label="Remove file" disabled={upload.isPending}>
                    <X className="size-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="mt-3 space-y-2">
              {savedResumes.isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              )}

              {savedResumes.isError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-danger-soft p-3 text-xs text-destructive">
                  <AlertCircle className="size-4" />
                  Failed to load saved resumes: {(savedResumes.error as Error).message}
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => savedResumes.refetch()}>
                    Retry
                  </Button>
                </div>
              )}

              {savedResumes.data && savedResumes.data.data.length === 0 && (
                <div className="surface-card rounded-xl p-8 text-center">
                  <FileText className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium">No resumes found in your library</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Switch to &ldquo;Upload New&rdquo; above to upload a candidate resume.
                  </p>
                </div>
              )}

              {savedResumes.data && savedResumes.data.data.length > 0 && (
                <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                  {savedResumes.data.data.map((r) => {
                    const isSelected = existingResume?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          setExistingResume(r);
                          setFileError(null);
                        }}
                        className={cn(
                          "surface-card flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-all",
                          isSelected
                            ? "border-primary bg-primary-soft/40 ring-1 ring-primary shadow-xs"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "grid size-8 place-items-center rounded-md",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">{r.filename}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">ID #{r.id}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT.join(",")}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />

          {fileError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" /> {fileError}
            </p>
          )}
        </section>

        {/* STEP 2: JOB DESCRIPTION (Only for Job Match) or GENERAL INFO CARD */}
        {analysisMode === "job_match" ? (
          <section className="mt-8">
            <Label htmlFor="jd" className="text-section">
              2. Job description
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste the full posting — title, responsibilities, and requirements.
            </p>
            <Textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
              className="mt-3 min-h-64 resize-y bg-card text-sm leading-relaxed"
            />
            <p
              className={cn(
                "mt-1.5 text-right text-xs tabular-nums",
                jd && !jdOk ? "text-warning" : "text-muted-foreground",
              )}
            >
              {jd.trim().length.toLocaleString()} characters{jd && !jdOk ? ` · at least ${MIN_JD} needed` : ""}
            </p>
          </section>
        ) : (
          <section className="mt-8">
            <div className="surface-card flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/20 p-4">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1 text-xs text-foreground/90">
                <p className="text-sm font-semibold text-foreground">General Resume Check (without JD)</p>
                <p className="leading-relaxed text-muted-foreground">
                  No job description is required. The engine will evaluate structural integrity, demonstrable skills,
                  clarity, formatting feedback, and actionable improvement recommendations.
                </p>
              </div>
            </div>
          </section>
        )}

        {analyze.isError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-danger-soft p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4" /> {(analyze.error as Error).message} Your inputs are kept — try again.
          </div>
        )}

        <div className="mt-8 flex items-center gap-4">
          <Button size="lg" disabled={!canSubmit} onClick={() => analyze.mutate()} className="gap-2 shadow-lift">
            {analyze.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />{" "}
                {analysisMode === "job_match" ? "Analyzing against job…" : "Auditing resume quality…"}
              </>
            ) : analysisMode === "job_match" ? (
              "Analyze against job"
            ) : (
              "Run general resume check"
            )}
          </Button>
          {analyze.isPending && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              This can take up to a minute.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
