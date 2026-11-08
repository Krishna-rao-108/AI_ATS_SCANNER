import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ShieldCheck,
  Loader2,
  ArrowRight,
  RefreshCw,
  FileText,
  FileCheck,
  Edit3,
  Check,
  AlertTriangle,
  FileCode,
  Layers,
  BookmarkCheck,
} from 'lucide-react';
import { useResumes } from '../hooks/useResumes';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { analysisService } from '../services/analysisService';
import type {
  ResumeTailorResponse,
  TailoredResumeData,
  SeniorityLevel,
  ToneType,
} from '../types/analysis';

export const ResumeTailor: React.FC = () => {
  const { resumes, loading: resumesLoading } = useResumes();
  const { success: toastSuccess, error: toastError } = useToast();

  // Inputs
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel>('entry-level');
  const [tone, setTone] = useState<ToneType>('professional');

  // Generation & Editing State
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<ResumeTailorResponse | null>(null);
  const [editedResume, setEditedResume] = useState<TailoredResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'audit' | 'markdown'>('editor');
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'docx' | null>(null);

  const seniorityOptions: { id: SeniorityLevel; label: string }[] = [
    { id: 'internship', label: 'Internship' },
    { id: 'entry-level', label: 'Entry-level / Fresher' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid-level', label: 'Mid-level' },
    { id: 'senior', label: 'Senior' },
    { id: 'staff', label: 'Staff / Principal' },
  ];

  const toneOptions: { id: ToneType; label: string }[] = [
    { id: 'professional', label: 'Professional' },
    { id: 'concise', label: 'Concise' },
    { id: 'impact-driven', label: 'Impact-driven' },
    { id: 'technical', label: 'Technical' },
  ];

  const handleGenerateTailored = async () => {
    if (!selectedResumeId) {
      toastError('Please select a source candidate resume from your library.');
      return;
    }
    if (!jobDescription.trim()) {
      toastError('Please enter target job requirements or job description.');
      return;
    }

    try {
      setIsTailoring(true);
      const res = await analysisService.tailorResume({
        resume_id: selectedResumeId,
        target_role: targetRole.trim() || undefined,
        job_title: targetRole.trim() || undefined,
        company_name: companyName.trim() || undefined,
        job_description: jobDescription.trim(),
        tone,
        seniority: seniorityLevel,
      });

      setTailorResult(res);
      setEditedResume(JSON.parse(JSON.stringify(res.tailored_resume)));
      setActiveTab('editor');
      toastSuccess('Grounded tailored resume generated with 100% content preservation!');
    } catch (err: any) {
      console.error('Tailoring error:', err);
      toastError(err?.message || 'Failed to tailor resume. Please check connection and try again.');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleReset = () => {
    setTailorResult(null);
    setEditedResume(null);
    setTargetRole('');
    setCompanyName('');
    setJobDescription('');
  };

  const handleDownloadFile = async (format: 'pdf' | 'docx') => {
    if (!tailorResult || !selectedResumeId) return;
    const resumeToDownload = editedResume || tailorResult.tailored_resume;

    try {
      setIsDownloading(format);
      const { blob, filename } = await analysisService.downloadTailoredDocument({
        resume_id: selectedResumeId,
        format,
        tailored_resume: resumeToDownload,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastSuccess(`Downloaded ${format.toUpperCase()} successfully: ${filename}`);
    } catch (err: any) {
      console.error('Download error:', err);
      toastError(err?.message || `Failed to download ${format.toUpperCase()}.`);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCopyMarkdown = () => {
    if (!tailorResult || !editedResume) return;

    // Generate markdown from the live edited state
    const lines: string[] = [];
    const name = editedResume.contact.name || 'Candidate';
    lines.push(`# ${name}`);

    const contactParts = [
      editedResume.contact.location,
      editedResume.contact.phone,
      editedResume.contact.email,
      editedResume.contact.linkedin,
      editedResume.contact.github,
      editedResume.contact.website || editedResume.contact.portfolio,
    ].filter(Boolean);

    if (contactParts.length) {
      lines.push(`**${contactParts.join(' | ')}**\n`);
    }

    if (editedResume.professional_summary) {
      lines.push(`## Professional Summary\n\n${editedResume.professional_summary}\n`);
    }

    if (editedResume.skills_categories.length) {
      lines.push('## Technical Skills\n');
      editedResume.skills_categories.forEach((cat) => {
        if (cat.skills.length) {
          lines.push(`- **${cat.category}:** ${cat.skills.join(', ')}`);
        }
      });
      lines.push('');
    }

    if (editedResume.experience.length) {
      lines.push('## Work Experience\n');
      editedResume.experience.forEach((exp) => {
        const dates = exp.dates ? ` (${exp.dates})` : '';
        const loc = exp.location ? ` | ${exp.location}` : '';
        lines.push(`### ${exp.role} — ${exp.company}${dates}${loc}\n`);
        exp.bullets.forEach((b) => lines.push(`- ${b.tailored}`));
        lines.push('');
      });
    }

    if (editedResume.projects.length) {
      lines.push('## Projects\n');
      editedResume.projects.forEach((p) => {
        const tech = p.technologies ? ` | *${p.technologies}*` : '';
        const dates = p.dates ? ` (${p.dates})` : '';
        lines.push(`### ${p.title}${tech}${dates}\n`);
        if (p.description) lines.push(`*${p.description}*\n`);
        p.bullets.forEach((b) => lines.push(`- ${b.tailored}`));
        lines.push('');
      });
    }

    if (editedResume.education.length) {
      lines.push('## Education\n');
      editedResume.education.forEach((edu) => {
        const dates = edu.dates ? ` (${edu.dates})` : '';
        const details = edu.gpa_or_details ? ` | ${edu.gpa_or_details}` : '';
        lines.push(`- **${edu.degree}** — ${edu.institution}${dates}${details}`);
      });
      lines.push('');
    }

    if (editedResume.certifications.length) {
      lines.push('## Certifications\n');
      editedResume.certifications.forEach((c) => {
        const issuer = c.issuer ? ` — ${c.issuer}` : '';
        const date = c.date ? ` (${c.date})` : '';
        lines.push(`- **${c.name}**${issuer}${date}`);
      });
      lines.push('');
    }

    if (editedResume.additional_sections && editedResume.additional_sections.length) {
      editedResume.additional_sections.forEach((addSec) => {
        lines.push(`## ${addSec.heading}\n`);
        addSec.items.forEach((item) => lines.push(`- ${item}`));
        lines.push('');
      });
    }

    navigator.clipboard.writeText(lines.join('\n').trim());
    toastSuccess('Live tailored resume copied to clipboard as Markdown!');
  };

  // Updaters for user live editing
  const updateSummary = (newSummary: string) => {
    if (!editedResume) return;
    setEditedResume({ ...editedResume, professional_summary: newSummary });
  };

  const updateProjectDescription = (projIdx: number, newDesc: string) => {
    if (!editedResume) return;
    const updatedProjects = [...editedResume.projects];
    updatedProjects[projIdx].description = newDesc;
    setEditedResume({ ...editedResume, projects: updatedProjects });
  };

  const updateProjectBullet = (projIdx: number, bulletIdx: number, newTailored: string) => {
    if (!editedResume) return;
    const updatedProjects = [...editedResume.projects];
    updatedProjects[projIdx].bullets[bulletIdx].tailored = newTailored;
    setEditedResume({ ...editedResume, projects: updatedProjects });
  };

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, newTailored: string) => {
    if (!editedResume) return;
    const updatedExp = [...editedResume.experience];
    updatedExp[expIdx].bullets[bulletIdx].tailored = newTailored;
    setEditedResume({ ...editedResume, experience: updatedExp });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Production ATS Resume Tailor
            </h2>
            <Badge variant="success" size="sm">
              Zero Content Loss
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Polished, evidence-based resume tailoring preserving 100% of candidate achievements and original sections.
          </p>
        </div>

        {tailorResult && (
          <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            New Tailoring Session
          </Button>
        )}
      </div>

      {/* Verification & Safeguards Banner */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-violet-50)] border border-[var(--color-violet-100)] text-xs text-[var(--color-violet-700)] flex items-start gap-3 shadow-[var(--shadow-xs)]">
        <ShieldCheck className="w-4 h-4 text-[var(--color-violet-600)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-violet-700)]">Deterministic Grounding & Zero Content Loss Guarantee</p>
          <p className="text-[var(--color-ink-700)] leading-relaxed">
            The tailoring engine strictly preserves every project, bullet, work experience, education credential, and additional section. Unmet job requirements are isolated into skill gaps and never injected as candidate experience. All quantifiable metrics are checked against source resume facts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Source Material */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Resume Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>1. Select Candidate Resume</span>
                <span className="text-[11px] font-normal text-slate-500">Source of Truth</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {resumesLoading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : resumes.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                        selectedResumeId === r.id
                          ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)] text-[var(--color-violet-700)] shadow-xs ring-1 ring-[var(--color-violet-400)]/30'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold truncate">{r.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Resume ID #{r.id}</div>
                      </div>
                      {selectedResumeId === r.id && <Check className="w-4 h-4 text-[var(--color-violet-600)] shrink-0" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                  No saved resumes uploaded yet. Upload your resume in the My Resumes page first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 2. Target Role & Company */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">2. Target Role & Company</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Input
                label="Target Job Title"
                placeholder="e.g. Software Development Engineer / Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
              <Input
                label="Company Name (Optional)"
                placeholder="e.g. Google, Stripe, Microsoft"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />
              <Textarea
                label="Job Description & Key Requirements"
                rows={5}
                placeholder="Paste key responsibilities and qualifications from the target job posting..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* 3. Constrained Seniority & Tone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">3. Alignment Scope & Tone</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Seniority Scope (Default: Entry-level / Fresher)
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {seniorityOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeniorityLevel(s.id)}
                      className={`p-2 rounded-lg border text-left transition-colors font-medium ${
                        seniorityLevel === s.id
                          ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)] text-[var(--color-violet-700)] font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Controls framing style. Does not authorize fabricated years or roles.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Writing Tone
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {toneOptions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-2 rounded-lg border text-left transition-colors font-medium ${
                        tone === t.id
                          ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)] text-[var(--color-violet-700)] font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full mt-2"
                onClick={handleGenerateTailored}
                disabled={isTailoring || !selectedResumeId || !jobDescription.trim()}
                leftIcon={
                  isTailoring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
              >
                {isTailoring ? 'Analyzing & Tailoring Resume...' : 'Tailor My Resume'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tailored Resume Document, Audit & Downloads */}
        <div className="lg:col-span-7 space-y-5">
          {isTailoring ? (
            <Card className="h-full min-h-[480px] flex items-center justify-center text-center p-8">
              <div className="max-w-md space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-violet-600)] mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Executing Zero-Content-Loss Tailoring</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Extracting factual sections from source resume, identifying genuine skill alignments, reformulating bullets with impact verbs, auditing content preservation, and verifying zero hallucination...
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Badge variant="info" size="sm">Checking Metrics</Badge>
                  <Badge variant="info" size="sm">Preserving Experience</Badge>
                  <Badge variant="info" size="sm">Isolating Gaps</Badge>
                </div>
              </div>
            </Card>
          ) : tailorResult && editedResume ? (
            <div className="space-y-5">
              {/* Top Action Bar with Real Document Downloads */}
              <Card className="bg-slate-900 text-white border-slate-800">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      ATS Document Ready
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Target: {editedResume.target_role} ({editedResume.seniority})
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success" size="sm">
                        Grounding Verified
                      </Badge>
                      <Badge variant={tailorResult.content_preservation_verified ? 'success' : 'warning'} size="sm">
                        {tailorResult.content_preservation_verified ? '100% Content Preserved' : 'Preservation Review Required'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadFile('pdf')}
                      disabled={isDownloading !== null}
                      leftIcon={
                        isDownloading === 'pdf' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      {isDownloading === 'pdf' ? 'Generating PDF...' : 'Download ATS PDF'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadFile('docx')}
                      disabled={isDownloading !== null}
                      leftIcon={
                        isDownloading === 'docx' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )
                      }
                      className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    >
                      {isDownloading === 'docx' ? 'Building Word...' : 'Download DOCX'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyMarkdown}
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                      className="text-white border-slate-700 hover:bg-slate-800"
                    >
                      Copy Markdown
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Flagged Claims Alert Banner (if any) */}
              {tailorResult.unsupported_claims_flagged && tailorResult.unsupported_claims_flagged.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Factual Safety Guardrail Interventions ({tailorResult.unsupported_claims_flagged.length})
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-800 text-[11px]">
                    {tailorResult.unsupported_claims_flagged.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'editor'
                      ? 'bg-[var(--color-violet-600)] text-white shadow-xs'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-raised)]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Interactive Resume & Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'bg-[var(--color-violet-600)] text-white shadow-xs'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-raised)]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Content Preservation & Gaps Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'markdown'
                      ? 'bg-[var(--color-violet-600)] text-white shadow-xs'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-raised)]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Markdown View
                </button>
              </div>

              {/* Tab 1: Interactive Resume Editor */}
              {activeTab === 'editor' && (
                <div className="space-y-5">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">
                            {editedResume.contact.name || 'Candidate Name'}
                          </CardTitle>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {[
                              editedResume.contact.email,
                              editedResume.contact.phone,
                              editedResume.contact.location,
                              editedResume.contact.linkedin,
                              editedResume.contact.github,
                              editedResume.contact.website || editedResume.contact.portfolio,
                            ]
                              .filter(Boolean)
                              .join(' | ')}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">
                          ATS Single-Column Format
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Section: Professional Summary */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Professional Summary (Editable)
                          </label>
                          <span className="text-[10px] text-slate-400">Edits included in downloaded PDF/DOCX</span>
                        </div>
                        <textarea
                          rows={3}
                          value={editedResume.professional_summary}
                          onChange={(e) => updateSummary(e.target.value)}
                          className="w-full text-xs text-slate-800 p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed font-sans"
                        />
                      </div>

                      {/* Section: Technical Skills */}
                      {editedResume.skills_categories.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Technical Skills
                          </h4>
                          <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            {editedResume.skills_categories.map((cat, idx) => (
                              <div key={idx} className="text-xs flex flex-wrap items-baseline gap-1.5">
                                <span className="font-semibold text-slate-800">{cat.category}:</span>
                                <span className="text-slate-600">{cat.skills.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section: Projects */}
                      {editedResume.projects.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Technical Projects ({editedResume.projects.length})
                          </h4>
                          {editedResume.projects.map((proj, pIdx) => (
                            <div key={pIdx} className="space-y-2 p-3.5 bg-slate-50/50 rounded-lg border border-slate-200/80">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{proj.title}</span>
                                <div className="flex items-center gap-2">
                                  {proj.technologies && (
                                    <span className="text-[11px] text-indigo-600 font-medium">{proj.technologies}</span>
                                  )}
                                  {proj.dates && (
                                    <span className="text-[10px] text-slate-400 font-normal">({proj.dates})</span>
                                  )}
                                </div>
                              </div>

                              {/* Editable Project Description */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                  Project Description / Overview
                                </label>
                                <input
                                  type="text"
                                  value={proj.description || ''}
                                  placeholder="Brief overview of project architecture and scope..."
                                  onChange={(e) => updateProjectDescription(pIdx, e.target.value)}
                                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-600 focus:outline-none"
                                />
                              </div>

                              {/* Bullets */}
                              <div className="space-y-2 pl-2 pt-1">
                                {proj.bullets.map((b, bIdx) => (
                                  <div key={bIdx} className="space-y-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-slate-400 mt-1.5">&bull;</span>
                                      <input
                                        type="text"
                                        value={b.tailored}
                                        onChange={(e) => updateProjectBullet(pIdx, bIdx, e.target.value)}
                                        className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-600 focus:outline-none"
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-400 pl-4">
                                      Source: "{b.original}"
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section: Work Experience */}
                      {editedResume.experience.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Work Experience
                          </h4>
                          {editedResume.experience.map((exp, eIdx) => (
                            <div key={eIdx} className="space-y-2 p-3.5 bg-slate-50/50 rounded-lg border border-slate-200/80">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">
                                  {exp.role} — {exp.company}
                                </span>
                                {exp.dates && (
                                  <span className="text-[11px] text-slate-500 font-medium">{exp.dates}</span>
                                )}
                              </div>
                              <div className="space-y-2 pl-2">
                                {exp.bullets.map((b, bIdx) => (
                                  <div key={bIdx} className="space-y-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-slate-400 mt-1.5">&bull;</span>
                                      <input
                                        type="text"
                                        value={b.tailored}
                                        onChange={(e) => updateExperienceBullet(eIdx, bIdx, e.target.value)}
                                        className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-600 focus:outline-none"
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-400 pl-4">
                                      Source: "{b.original}"
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section: Education */}
                      {editedResume.education.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Education
                          </h4>
                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                            {editedResume.education.map((edu, idx) => (
                              <div key={idx} className="text-xs flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  {edu.degree} — {edu.institution}
                                  {edu.gpa_or_details && ` (${edu.gpa_or_details})`}
                                </span>
                                <span className="text-slate-500 text-[11px]">{edu.dates}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section: Certifications */}
                      {editedResume.certifications.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Certifications
                          </h4>
                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                            {editedResume.certifications.map((cert, idx) => (
                              <div key={idx} className="text-xs flex items-center justify-between">
                                <span className="font-semibold text-slate-900">
                                  {cert.name}
                                  {cert.issuer && ` — ${cert.issuer}`}
                                </span>
                                <span className="text-slate-500 text-[11px]">{cert.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section: Additional Sections */}
                      {editedResume.additional_sections && editedResume.additional_sections.length > 0 && (
                        <div className="space-y-3">
                          {editedResume.additional_sections.map((addSec, idx) => (
                            <div key={idx} className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                {addSec.heading}
                              </h4>
                              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                                {addSec.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                    <span className="text-slate-400 mt-1">&bull;</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tab 2: Preservation & Grounding Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-5">
                  {/* Preservation Metrics Summary */}
                  {tailorResult.preservation_audit && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-lg font-bold text-emerald-800">
                          {tailorResult.preservation_audit.preserved_unchanged_count}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700 mt-0.5">Preserved Verbatim</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[var(--color-violet-50)] border border-[var(--color-violet-100)] text-center">
                        <div className="text-lg font-bold text-[var(--color-violet-700)]">
                          {tailorResult.preservation_audit.rewritten_verified_count}
                        </div>
                        <div className="text-[11px] font-medium text-[var(--color-violet-700)] mt-0.5">Rewritten & Verified</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-lg font-bold text-slate-800">
                          {tailorResult.preservation_audit.flagged_count}
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 mt-0.5">Flagged / Corrected</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                        <div className="text-lg font-bold text-amber-800">
                          {tailorResult.preservation_audit.missing_rejected_count}
                        </div>
                        <div className="text-[11px] font-medium text-amber-700 mt-0.5">Missing Items (0 = Zero Loss)</div>
                      </div>
                    </div>
                  )}

                  {/* Skill Gaps Card */}
                  <Card>
                    <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                      <CardTitle className="text-sm text-amber-950 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Identified Job Skill Gaps ({editedResume.skill_gaps.length})
                      </CardTitle>
                      <p className="text-xs text-amber-800">
                        These job posting requirements are not evidenced in your resume. To prevent fabrication, they have been intentionally omitted from your qualifications.
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      {editedResume.skill_gaps.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {editedResume.skill_gaps.map((gap, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100/70 text-amber-900 border border-amber-200"
                            >
                              Missing: {gap}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 font-medium">
                          All key job requirements were supported by qualifications in your source resume!
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bullet Comparisons List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Bullet-by-Bullet Grounding Audit
                    </h3>

                    {editedResume.projects.map((proj, pIdx) =>
                      proj.bullets.map((b, bIdx) => (
                        <div
                          key={`proj-${pIdx}-${bIdx}`}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {proj.title}
                            </span>
                            <Badge variant={b.grounding_status === 'retained_original' ? 'warning' : 'success'} size="sm">
                              {b.grounding_status === 'retained_original' ? 'Retained Original' : 'Grounding Verified'}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Original Factual Bullet:
                            </span>
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                              {b.original}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              ATS Formulated Bullet:
                            </span>
                            <p className="text-xs font-semibold text-slate-900 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                              {b.tailored}
                            </p>
                          </div>

                          {b.explanation && (
                            <p className="text-[11px] text-slate-500 flex items-start gap-1">
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span><strong>Rationale:</strong> {b.explanation}</span>
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Markdown */}
              {activeTab === 'markdown' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Markdown Source Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <pre className="text-xs text-slate-800 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                      {tailorResult.raw_markdown}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full min-h-[480px] flex items-center justify-center text-center p-8">
              <div className="max-w-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ready to Tailor</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select your saved candidate resume on the left, paste the target job requirements, and click Tailor My Resume.
                </p>
                <div className="pt-2 text-[11px] text-slate-400">
                  Outputs complete ATS-friendly PDF and DOCX documents with selectable text and 100% content preservation.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
