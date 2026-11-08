import React, { useState } from 'react';
import {
  FileText,
  Building,
  Briefcase,
  Copy,
  Download,
  CheckCircle2,
  Sparkles,
  Loader2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useResumes } from '../hooks/useResumes';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { analysisService } from '../services/analysisService';
import type { CoverLetterResponse } from '../types/analysis';

export const CoverLetter: React.FC = () => {
  const { resumes, loading: resumesLoading } = useResumes();
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'conversational'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterResult, setLetterResult] = useState<CoverLetterResponse | null>(null);
  const [editableLetter, setEditableLetter] = useState('');

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toastError('Please select a source candidate resume.');
      return;
    }
    if (!jobTitle.trim()) {
      toastError('Please enter the target job title.');
      return;
    }
    if (!companyName.trim()) {
      toastError('Please enter the company name.');
      return;
    }
    if (!jobDescription.trim()) {
      toastError('Please enter the job description requirements.');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await analysisService.generateCoverLetter({
        resume_id: selectedResumeId,
        job_title: jobTitle.trim(),
        company_name: companyName.trim(),
        job_description: jobDescription.trim(),
        tone,
      });

      setLetterResult(res);
      setEditableLetter(res.cover_letter);
      toastSuccess('Personalized cover letter generated successfully!');
    } catch (err: any) {
      console.error('Cover letter generation error:', err);
      toastError(err?.message || 'Failed to generate cover letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!editableLetter) return;
    navigator.clipboard.writeText(editableLetter);
    toastSuccess('Cover letter copied to clipboard!');
  };

  const handleDownload = () => {
    if (!editableLetter || !letterResult) return;
    const blob = new Blob([editableLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedCompany = letterResult.company_name.replace(/\s+/g, '_').toLowerCase();
    link.download = `cover_letter_${sanitizedCompany}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Cover letter downloaded!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
            AI Cover Letter Generator
          </h2>
          <Badge variant="violet" size="sm">
            Grounded AI Pipeline
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-0.5">
          Draft role-specific cover letters targeted directly to extracted job description requirements using verified candidate experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Role & Resume Inputs */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Job & Candidate Details</CardTitle>
                <CardDescription>Target role requirements & tone</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Target Job Title"
                  placeholder="e.g. Senior Machine Learning Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  leftIcon={<Briefcase className="w-4 h-4" />}
                />
                <Input
                  label="Company Name"
                  placeholder="e.g. Anthropic"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-700)] tracking-wide uppercase mb-1.5">
                  Select Source Resume
                </label>
                {resumesLoading ? (
                  <div className="h-10 bg-[var(--color-raised)] rounded animate-pulse" />
                ) : resumes.length > 0 ? (
                  <select
                    className="w-full bg-[var(--color-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--color-ink-900)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-violet-400)]/20 focus:border-[var(--color-violet-500)]"
                    value={selectedResumeId || ''}
                    onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                  >
                    <option value="">Choose candidate resume...</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} (ID #{r.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[var(--color-ink-500)] italic">No resumes uploaded yet.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-700)] tracking-wide uppercase mb-1.5">
                  Desired Narrative Tone
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['professional', 'persuasive', 'conversational'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`p-2 rounded-[var(--radius-md)] border text-center capitalize transition-all ${
                        tone === t
                          ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)] text-[var(--color-violet-700)] font-semibold shadow-xs'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--color-ink-700)] bg-[var(--color-surface)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Job Description Requirements"
                rows={5}
                placeholder="Paste key qualifications or responsibilities to address in the letter..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full mt-2"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedResumeId}
                leftIcon={
                  isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
              >
                {isGenerating ? 'Generating Letter with AI...' : 'Generate Cover Letter'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Area: Output editor container */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Generated Cover Letter</CardTitle>
                  <CardDescription>Tailored & editable draft</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!editableLetter}
                    onClick={handleCopy}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!editableLetter}
                    onClick={handleDownload}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col">
              {isGenerating ? (
                <div className="my-auto text-center space-y-3 py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-violet-600)] mx-auto" />
                  <h4 className="text-sm font-semibold text-[var(--color-ink-900)]">Drafting Personalized Letter</h4>
                  <p className="text-xs text-[var(--color-ink-500)] max-w-xs mx-auto">
                    Aligning candidate accomplishments with {companyName || 'the target company'}'s stated qualifications...
                  </p>
                </div>
              ) : letterResult && editableLetter ? (
                <div className="space-y-4 flex-1 flex flex-col">
                  {letterResult.key_qualifications_addressed?.length > 0 && (
                    <div className="p-3.5 bg-[var(--color-raised)]/70 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider block mb-1.5">
                        Key Qualifications Addressed:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {letterResult.key_qualifications_addressed.map((q, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] px-2 py-0.5 rounded-md"
                          >
                            <Check className="w-3 h-3 text-[var(--color-violet-600)]" />
                            {q}
                          </span>
                        ))}
                      </div>
                      {letterResult.unsupported_skills_avoided && letterResult.unsupported_skills_avoided.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--color-ink-500)] flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Anti-Hallucination Safe
                          </span>
                          <span>
                            Deliberately avoided unverified JD claims: {letterResult.unsupported_skills_avoided.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-semibold text-[var(--color-ink-700)]">
                        Editable Letter Content:
                      </label>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-500)]">
                        {letterResult.candidate_name && (
                          <span className="bg-[var(--color-raised)] text-[var(--color-ink-700)] px-2 py-0.5 rounded font-medium">
                            Author: {letterResult.candidate_name}
                          </span>
                        )}
                        <span className="bg-[var(--color-raised)] text-[var(--color-ink-700)] px-2 py-0.5 rounded font-medium">
                          {editableLetter.trim().split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={editableLetter}
                      onChange={(e) => setEditableLetter(e.target.value)}
                      rows={14}
                      className="w-full flex-1 p-3.5 text-xs text-[var(--color-ink-900)] bg-[var(--color-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-violet-400)]/20 focus:border-[var(--color-violet-500)] leading-relaxed font-sans resize-y"
                    />
                  </div>
                </div>
              ) : (
                <div className="my-auto max-w-sm mx-auto space-y-3 py-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-raised)] text-[var(--color-ink-300)] flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--color-ink-900)]">Ready to Draft</h4>
                  <p className="text-xs text-[var(--color-ink-500)] leading-relaxed">
                    Select a candidate resume, specify company & position, and click Generate to produce an editable, grounded cover letter.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
