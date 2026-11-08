import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Edit3,
  FileCode,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, DemoNotice, reveal, Reveal } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { resumesQuery } from "@/lib/api/services";
import type { Resume } from "@/lib/api/types";
import { TailorConfig } from "@/components/tailor/TailorConfig";
import { TailorEditor } from "@/components/tailor/TailorEditor";
import { TailorComparison } from "@/components/tailor/TailorComparison";
import { TailorAudit } from "@/components/tailor/TailorAudit";
import { TailorDocumentPreview } from "@/components/tailor/TailorDocumentPreview";
import {
  generateMockTailoring,
  TAILOR_PRESETS,
  type TailorPreset,
} from "@/components/tailor/tailorMockData";
import type {
  TailoredResumeData,
  SeniorityLevel,
  ToneType,
} from "@/components/tailor/tailorTypes";

export const Route = createFileRoute("/tailor")({
  head: () => ({
    meta: [
      { title: "Resume Tailoring — ATS Analyzer" },
      { name: "description", content: "Adapt your resume for a specific role with 100% content preservation." },
      { property: "og:title", content: "Resume Tailoring — ATS Analyzer" },
      { property: "og:description", content: "Adapt your resume for a specific role with 100% content preservation." },
    ],
  }),
  component: TailorPage,
});

const DEFAULT_RESUMES: Resume[] = [
  {
    id: "demo-r1",
    filename: "Alex_Rivera_Resume.pdf",
    size_bytes: 182000,
    uploaded_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "demo-r2",
    filename: "Alex_Rivera_Frontend.docx",
    size_bytes: 96000,
    uploaded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function TailorPage() {
  const resumesQ = useQuery(resumesQuery);
  const resumes = (resumesQ.data?.data && resumesQ.data.data.length > 0)
    ? resumesQ.data.data
    : DEFAULT_RESUMES;

  // Form State
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    resumes[0]?.id ?? "demo-r1"
  );
  const defaultPreset = TAILOR_PRESETS[0] ?? {
    id: "preset-1",
    label: "Full Stack Engineer",
    role: "Senior Full Stack Engineer",
    company: "Stripe",
    jobDescription: "Build developer-facing payments infrastructure using TypeScript and Python.",
    seniority: "senior" as SeniorityLevel,
    tone: "professional" as ToneType,
  };
  const [targetRole, setTargetRole] = useState(defaultPreset.role);
  const [companyName, setCompanyName] = useState(defaultPreset.company);
  const [jobDescription, setJobDescription] = useState(defaultPreset.jobDescription);
  const [seniority, setSeniority] = useState<SeniorityLevel>(defaultPreset.seniority);
  const [tone, setTone] = useState<ToneType>(defaultPreset.tone);


  // Generation & Active View State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("editor");

  const handleApplyPreset = (p: TailorPreset) => {
    setTargetRole(p.role);
    setCompanyName(p.company);
    setJobDescription(p.jobDescription);
    setSeniority(p.seniority);
    setTone(p.tone);
    toast.info(`Loaded preset: ${p.label}`);
  };

  const handleGenerate = () => {
    if (!selectedResumeId) {
      toast.error("Please select a candidate resume from the list.");
      return;
    }
    if (jobDescription.trim().length < 30) {
      toast.error("Please enter a job description or select a preset.");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Extracting factual sections from source resume...");

    setTimeout(() => {
      setGenerationStep("Auditing facts against 100% zero-loss guardrails...");
    }, 450);

    setTimeout(() => {
      setGenerationStep("Reformulating bullets with target ATS impact verbs...");
    }, 850);

    setTimeout(() => {
      const activeResume =
        resumes.find((r) => r.id === selectedResumeId) ?? resumes[0];
      const result = generateMockTailoring({
        resumeId: selectedResumeId,
        resumeFilename: activeResume?.filename ?? "Resume.pdf",
        targetRole,
        companyName,
        jobDescription,
        seniority,
        tone,
      });

      setTailoredResume(result);
      setIsGenerating(false);
      setGenerationStep("");
      setActiveTab("editor");
      toast.success(
        "Tailored resume generated with verified zero content loss!",
        {
          description: `${result.experience.reduce(
            (acc, e) => acc + e.bullets.length,
            0
          )} bullets aligned to ${result.target_role}`,
        }
      );
    }, 1300);
  };

  const handleReset = () => {
    setTailoredResume(null);
    toast.info("Cleared tailored resume session.");
  };

  return (
    <AppShell
      title="Resume Tailoring"
      actions={
        tailoredResume ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            New Tailoring Session
          </Button>
        ) : undefined
      }
    >
      <PageHeader
        title="Resume Tailoring"
        description="Adapt your resume for a target role with zero content loss. All source achievements and quantitative metrics are strictly preserved."
        actions={
          <Badge
            variant="outline"
            className="text-xs font-medium border-success/40 bg-success-soft text-success gap-1"
          >
            <ShieldCheck className="size-3.5" /> Zero Content Loss Guarantee
          </Badge>
        }
      />

      <DemoNotice>
        Tailoring operates in demonstration mode. Factual sections, ATS diffs, and document downloads
        are computed locally with deterministic grounding algorithms.
      </DemoNotice>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls (4 cols on wide screens) */}
        <Reveal
          {...reveal(0)}
          className={tailoredResume ? "lg:col-span-4" : "lg:col-span-6 lg:col-start-4"}
        >
          <TailorConfig
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onSelectResume={setSelectedResumeId}
            targetRole={targetRole}
            onTargetRoleChange={setTargetRole}
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            seniority={seniority}
            onSeniorityChange={setSeniority}
            tone={tone}
            onToneChange={setTone}
            onApplyPreset={handleApplyPreset}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </Reveal>

        {/* Right Column: Tailored Resume Surface (8 cols on wide screens) */}
        {tailoredResume ? (
          <Reveal {...reveal(1)} className="lg:col-span-8 space-y-5">
            {/* Top Ready Banner */}
            <div className="surface-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-card to-primary-soft/20 border-primary/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Tailored for {tailoredResume.target_role}
                    {tailoredResume.target_company && ` at ${tailoredResume.target_company}`}
                  </h3>
                  <Badge variant="outline" className="text-[11px] text-success border-success/30 bg-success-soft">
                    <CheckCircle2 className="size-3 mr-1" /> Grounding Verified
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Source: {tailoredResume.resume_filename} · Style: {tailoredResume.seniority} (
                  {tailoredResume.tone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {tailoredResume.preservation_audit.rewritten_verified_count} bullets improved
                </Badge>
                <Badge variant="outline" className="font-mono text-xs text-warning border-warning/30 bg-warning-soft">
                  {tailoredResume.skill_gaps.length} skill gaps isolated
                </Badge>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-10 p-1 bg-muted/60 overflow-x-auto">
                <TabsTrigger value="editor" className="gap-1.5 text-xs">
                  <Edit3 className="size-3.5" />
                  Interactive Editor
                </TabsTrigger>
                <TabsTrigger value="diff" className="gap-1.5 text-xs">
                  <Layers className="size-3.5" />
                  Original vs. Tailored Diff
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5" />
                  Preservation Audit ({tailoredResume.preservation_audit.preserved_unchanged_count + tailoredResume.preservation_audit.rewritten_verified_count})
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 text-xs">
                  <FileText className="size-3.5" />
                  Document Preview & Download
                </TabsTrigger>
                <TabsTrigger value="markdown" className="gap-1.5 text-xs">
                  <FileCode className="size-3.5" />
                  Markdown View
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Interactive Resume Editor */}
              <TabsContent value="editor" className="mt-4">
                <TailorEditor
                  resume={tailoredResume}
                  onChange={setTailoredResume}
                />
              </TabsContent>

              {/* Tab 2: Original vs Tailored Diff */}
              <TabsContent value="diff" className="mt-4">
                <TailorComparison resume={tailoredResume} />
              </TabsContent>

              {/* Tab 3: Preservation Audit */}
              <TabsContent value="audit" className="mt-4">
                <TailorAudit resume={tailoredResume} />
              </TabsContent>

              {/* Tab 4: Live Document Preview */}
              <TabsContent value="preview" className="mt-4">
                <TailorDocumentPreview resume={tailoredResume} />
              </TabsContent>

              {/* Tab 5: Raw Markdown */}
              <TabsContent value="markdown" className="mt-4">
                <div className="surface-card p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Markdown Source</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(tailoredResume.raw_markdown);
                        toast.success("Markdown copied to clipboard!");
                      }}
                      className="text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs font-mono p-4 rounded-lg bg-muted/40 border border-border text-foreground leading-relaxed overflow-x-auto max-h-[500px]">
                    {tailoredResume.raw_markdown}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </Reveal>
        ) : isGenerating ? (
          /* Loading Animation Card */
          <Reveal {...reveal(1)} className="lg:col-span-6 lg:col-start-4">
            <div className="surface-card p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[380px]">
              <div className="relative">
                <div className="size-14 rounded-2xl bg-primary-soft text-primary grid place-items-center shadow-lift">
                  <Sparkles className="size-7 animate-pulse" />
                </div>
                <Loader2 className="size-6 text-primary animate-spin absolute -bottom-1 -right-1" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-bold text-foreground">
                  Running Deterministic Tailoring Pipeline
                </h3>
                <p className="text-xs text-primary font-medium animate-pulse">
                  {generationStep}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Verifying zero factual alteration and mapping skills to target ATS requirements...
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Grounding Verified
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Zero Hallucination
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Skill Gaps Isolated
                </Badge>
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>
    </AppShell>
  );
}
