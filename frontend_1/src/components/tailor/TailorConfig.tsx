import { useState } from "react";
import {
  Briefcase,
  Building,
  Check,
  FileText,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Resume } from "@/lib/api/types";
import type { SeniorityLevel, ToneType } from "./tailorTypes";
import { TAILOR_PRESETS, type TailorPreset } from "./tailorMockData";
import { cn } from "@/lib/utils";

interface TailorConfigProps {
  resumes: Resume[];
  selectedResumeId: string;
  onSelectResume: (id: string) => void;
  targetRole: string;
  onTargetRoleChange: (val: string) => void;
  companyName: string;
  onCompanyNameChange: (val: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (val: string) => void;
  seniority: SeniorityLevel;
  onSeniorityChange: (val: SeniorityLevel) => void;
  tone: ToneType;
  onToneChange: (val: ToneType) => void;
  onApplyPreset: (preset: TailorPreset) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SENIORITY_OPTIONS: { id: SeniorityLevel; label: string }[] = [
  { id: "entry-level", label: "Entry / Fresher" },
  { id: "junior", label: "Junior (1-3y)" },
  { id: "mid-level", label: "Mid-level (3-5y)" },
  { id: "senior", label: "Senior (5-8y)" },
  { id: "staff", label: "Staff / Lead (8y+)" },
];

const TONE_OPTIONS: { id: ToneType; label: string; desc: string }[] = [
  { id: "professional", label: "Professional", desc: "Balanced, authoritative" },
  { id: "impact-driven", label: "Impact-driven", desc: "Action verbs & metrics" },
  { id: "concise", label: "Concise", desc: "Direct, high-signal" },
  { id: "technical", label: "Technical", desc: "In-depth architecture focus" },
];

export function TailorConfig({
  resumes,
  selectedResumeId,
  onSelectResume,
  targetRole,
  onTargetRoleChange,
  companyName,
  onCompanyNameChange,
  jobDescription,
  onJobDescriptionChange,
  seniority,
  onSeniorityChange,
  tone,
  onToneChange,
  onApplyPreset,
  onGenerate,
  isGenerating,
}: TailorConfigProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetClick = (p: TailorPreset) => {
    setActivePreset(p.id);
    onApplyPreset(p);
  };

  const canSubmit = Boolean(selectedResumeId && jobDescription.trim().length >= 30);

  return (
    <div className="space-y-5">
      {/* 1. Resume Selection Card */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-section flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              1. Source Candidate Resume
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Source of truth: facts and metrics are preserved verbatim
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground">
            {resumes.length} available
          </Badge>
        </div>

        <div className="mt-3.5 space-y-2">
          {resumes.map((r) => {
            const isSelected = selectedResumeId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectResume(r.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between",
                  isSelected
                    ? "border-primary bg-primary-soft/50 text-foreground shadow-xs ring-1 ring-primary/40"
                    : "border-border hover:border-border/80 bg-background/50 hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="min-w-0 pr-3">
                  <p className="font-semibold truncate">{r.filename}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Uploaded {new Date(r.uploaded_at).toLocaleDateString()} · {(r.size_bytes / 1024).toFixed(0)} KB
                  </p>
                </div>
                {isSelected && (
                  <div className="size-5 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check className="size-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Role & Company Card */}
      <div className="surface-card p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-section flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              2. Target Role & Requirements
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Specify the role or use a 1-click test preset
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Zap className="size-3 text-warning" /> Quick Job Presets:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {TAILOR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                  activePreset === p.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 hover:bg-muted border-border text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="target-role" className="text-xs font-medium">
              Target Role / Job Title
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="target-role"
                placeholder="e.g. Senior Frontend Engineer"
                value={targetRole}
                onChange={(e) => {
                  setActivePreset(null);
                  onTargetRoleChange(e.target.value);
                }}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-name" className="text-xs font-medium">
              Company Name (Optional)
            </Label>
            <div className="relative">
              <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="company-name"
                placeholder="e.g. Stripe, Vercel"
                value={companyName}
                onChange={(e) => {
                  setActivePreset(null);
                  onCompanyNameChange(e.target.value);
                }}
                className="pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="job-desc" className="text-xs font-medium">
              Job Description / Requirements
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {jobDescription.length} chars
            </span>
          </div>
          <Textarea
            id="job-desc"
            rows={5}
            placeholder="Paste job posting requirements, required tech stack, and key responsibilities..."
            value={jobDescription}
            onChange={(e) => {
              setActivePreset(null);
              onJobDescriptionChange(e.target.value);
            }}
            className="text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* 3. Seniority Scope & Tone Card */}
      <div className="surface-card p-5 space-y-4">
        <div>
          <h3 className="text-section flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            3. Alignment Scope & Tone
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Frames impact verbs and tone without fabricating unearned experience
          </p>
        </div>

        {/* Seniority Buttons */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Seniority Scope</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {SENIORITY_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSeniorityChange(s.id)}
                className={cn(
                  "p-2 rounded-lg border text-left text-xs font-medium transition-colors",
                  seniority === s.id
                    ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border-border hover:bg-muted/60 text-foreground bg-card"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Options */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Writing Tone</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onToneChange(t.id)}
                className={cn(
                  "p-2.5 rounded-lg border text-left text-xs transition-colors",
                  tone === t.id
                    ? "border-primary bg-primary-soft/60 text-foreground font-medium ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/50 text-muted-foreground bg-card"
                )}
              >
                <p className="font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          size="lg"
          className="w-full mt-2 gap-2 shadow-lift"
          onClick={onGenerate}
          disabled={!canSubmit || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Tailoring Resume...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Tailor My Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
