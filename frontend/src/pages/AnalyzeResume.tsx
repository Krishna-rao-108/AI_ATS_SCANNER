import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Briefcase,
  Building,
  FileCheck,
  ClipboardPaste,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useResumes } from '../hooks/useResumes';
import { resumeService } from '../services/resumeService';
import { jdService } from '../services/jdService';
import { analysisService } from '../services/analysisService';
import { formatBytes, parseAnalysisResult } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { Badge } from '../components/ui/Badge';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export const AnalyzeResume: React.FC = () => {
  const navigate = useNavigate();
  const { toast, error: toastError, success: toastSuccess } = useToast();
  const { resumes, loading: loadingResumes } = useResumes();

  // Mode: upload fresh file OR select from existing stored resumes
  const [sourceMode, setSourceMode] = useState<'upload' | 'existing'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<number | null>(null);
  const [selectedExistingId, setSelectedExistingId] = useState<number | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis Mode: Job Match (with JD) vs General Resume Check (without JD)
  const [analysisMode, setAnalysisMode] = useState<'job_match' | 'general'>('job_match');

  // Job Description fields
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdError, setJdError] = useState<string | null>(null);

  // Process / Execution states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepLabel, setAnalysisStepLabel] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // If existing resumes exist, default selectedExistingId if in existing mode
  useEffect(() => {
    if (resumes.length > 0 && !selectedExistingId) {
      setSelectedExistingId(resumes[0].id);
    }
  }, [resumes, selectedExistingId]);

  // File validation
  const validateAndSetFile = (file: File) => {
    setFileValidationError(null);
    setGeneralError(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileValidationError('Only PDF (.pdf) and Word (.docx) documents are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileValidationError(
        `File size (${formatBytes(file.size)}) exceeds the 5 MB maximum limit.`
      );
      return;
    }

    setSelectedFile(file);
    setUploadedResumeId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handlePasteJD = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobDescription(text);
        toastSuccess('Job description pasted from clipboard');
      }
    } catch {
      toast('Paste directly into the text field using Ctrl+V or Cmd+V', 'info');
    }
  };

  const handleClearJD = () => {
    setJobDescription('');
  };

  const handleSubmitAnalysis = async () => {
    setGeneralError(null);
    setJdError(null);

    // 1. Validate Resume Selection
    let finalResumeId: number | null = null;
    let finalResumeTitle = '';

    if (sourceMode === 'upload') {
      if (!selectedFile) {
        setFileValidationError('Please choose or drag-and-drop a resume document.');
        return;
      }
      finalResumeTitle = selectedFile.name;
    } else {
      if (!selectedExistingId) {
        setFileValidationError('Please select a resume from your saved library.');
        return;
      }
      finalResumeId = selectedExistingId;
      const found = resumes.find((r) => r.id === selectedExistingId);
      finalResumeTitle = found?.title || `Resume #${selectedExistingId}`;
    }

    // 2. Validate Job Description (only if Job Match mode)
    if (analysisMode === 'job_match') {
      if (!jobTitle.trim()) {
        setJdError('Job title is required.');
        return;
      }
      if (!jobDescription.trim() || jobDescription.trim().length < 40) {
        setJdError('Job description must be at least 40 characters for accurate ATS evaluation.');
        return;
      }
    }

    // 3. Begin Analysis Flow
    setIsAnalyzing(true);

    try {
      // Step A: Upload file if newly selected
      if (sourceMode === 'upload' && !uploadedResumeId) {
        setAnalysisStepLabel('Uploading and parsing candidate resume...');
        const uploadRes = await resumeService.uploadResume(selectedFile!);
        finalResumeId = uploadRes.resume_id;
        setUploadedResumeId(finalResumeId);
      } else if (sourceMode === 'upload' && uploadedResumeId) {
        finalResumeId = uploadedResumeId;
      }

      if (!finalResumeId) {
        throw new Error('Resume processing failed. Valid resume ID not received.');
      }

      if (analysisMode === 'job_match') {
        // Step B: Save Job Description
        setAnalysisStepLabel('Registering job description...');
        const fullJdTitle = companyName.trim()
          ? `${jobTitle.trim()} at ${companyName.trim()}`
          : jobTitle.trim();

        const jdRes = await jdService.createJobDescription({
          title: fullJdTitle,
          description: jobDescription.trim(),
        });

        const finalJdId = jdRes.id;
        if (!finalJdId) {
          throw new Error('Failed to register job description with backend.');
        }

        // Step C: Execute AI Analysis via FastAPI -> Prune Backend
        setAnalysisStepLabel('Running ATS semantic matching & keyword audit...');
        const analysisRes = await analysisService.runAnalysis({
          resume_id: finalResumeId,
          jd_id: finalJdId,
          analysis_type: 'job_match',
        });

        // Step D: Validate and Parse Result
        const parsedData = parseAnalysisResult(analysisRes.result);

        // Save to session history
        const record = {
          id: analysisRes.id,
          resume_id: finalResumeId,
          jd_id: finalJdId,
          analysis_type: 'job_match',
          resume_title: finalResumeTitle,
          jd_title: fullJdTitle,
          result_data: parsedData,
          created_at: new Date().toISOString(),
        };
        analysisService.saveSessionRecord(record);

        toastSuccess('ATS Analysis completed successfully!');

        // Step E: Navigate to Results page with parsed data
        navigate('/results', { state: { analysis: record } });
      } else {
        // General Resume Check without a job description
        setAnalysisStepLabel('Running general resume quality audit...');
        const analysisRes = await analysisService.runAnalysis({
          resume_id: finalResumeId,
          jd_id: null,
          analysis_type: 'general',
        });

        // Step D: Validate and Parse Result
        const parsedData = parseAnalysisResult(analysisRes.result);

        // Save to session history
        const record = {
          id: analysisRes.id,
          resume_id: finalResumeId,
          jd_id: null,
          analysis_type: 'general',
          resume_title: finalResumeTitle,
          jd_title: 'General Resume Check',
          result_data: parsedData,
          created_at: new Date().toISOString(),
        };
        analysisService.saveSessionRecord(record);

        toastSuccess('General Resume Quality Audit completed successfully!');

        // Step E: Navigate to Results page with parsed data
        navigate('/results', { state: { analysis: record } });
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      const msg =
        err?.message ||
        'Analysis failed. Ensure the AI service / backend is reachable and try again.';
      setGeneralError(msg);
      toastError(msg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStepLabel('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Analysis Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
              {analysisMode === 'job_match' ? 'ATS Resume Screening' : 'General Resume Quality Check'}
            </h2>
            <Badge variant="outline" size="sm">
              {analysisMode === 'job_match' ? 'Deterministic Parse + Semantic AI' : 'Structure + Skills + Quality Audit'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-1">
            {analysisMode === 'job_match'
              ? 'Upload or select a candidate document and supply target job requirements to generate a comprehensive ATS alignment audit.'
              : 'Evaluate resume formatting, demonstrable skills, clarity, and structural impact without requiring a job description.'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center rounded-lg bg-[var(--color-raised)] p-0.5 text-xs border border-[var(--border-subtle)] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAnalysisMode('job_match')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              analysisMode === 'job_match'
                ? 'bg-white text-[var(--color-ink-900)] shadow-xs font-semibold'
                : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Job Match
          </button>
          <button
            type="button"
            onClick={() => setAnalysisMode('general')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              analysisMode === 'general'
                ? 'bg-white text-[var(--color-ink-900)] shadow-xs font-semibold'
                : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            General Resume Check (without JD)
          </button>
        </div>
      </div>

      {generalError && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900">Analysis Request Failed</h4>
            <p className="mt-0.5 leading-relaxed">{generalError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: RESUME SELECTION */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--color-violet-600)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <div>
                <CardTitle>Select or Upload Resume</CardTitle>
                <CardDescription>PDF or DOCX documents up to 5 MB</CardDescription>
              </div>
            </div>

            {resumes.length > 0 && (
              <div className="flex items-center rounded-lg bg-[var(--color-raised)] p-0.5 text-xs border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    sourceMode === 'upload'
                      ? 'bg-white text-[var(--color-ink-900)] shadow-xs'
                      : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]'
                  }`}
                >
                  Upload New
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('existing')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    sourceMode === 'existing'
                      ? 'bg-white text-[var(--color-ink-900)] shadow-xs'
                      : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]'
                  }`}
                >
                  From Library ({resumes.length})
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {sourceMode === 'upload' ? (
            <div>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-[var(--color-violet-500)] bg-[var(--color-violet-50)]/50'
                      : 'border-[var(--border-default)] hover:border-[var(--color-violet-400)] hover:bg-[var(--color-raised)]/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--color-ink-900)]">
                    Click to browse or drag and drop candidate resume
                  </h4>
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">
                    Accepts PDF (.pdf) or Word (.docx) documents up to 5 MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] border border-[var(--color-violet-200)] bg-[var(--color-violet-50)]/30">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-violet-600)] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-ink-900)] truncate">
                          {selectedFile.name}
                        </p>
                        <Badge variant="success" size="sm">
                          Ready
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-ink-500)] mt-0.5">
                        {formatBytes(selectedFile.size)} • {selectedFile.name.endsWith('.pdf') ? 'PDF Document' : 'Word DOCX'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadedResumeId(null);
                      }}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}

              {fileValidationError && (
                <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fileValidationError}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-700)] uppercase tracking-wider mb-2.5">
                Choose Stored Resume
              </label>
              {loadingResumes ? (
                <div className="h-10 rounded-lg bg-[var(--color-raised)] animate-pulse" />
              ) : resumes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedExistingId(resume.id)}
                      className={`p-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        selectedExistingId === resume.id
                          ? 'border-[var(--color-violet-600)] bg-[var(--color-violet-50)]/40 ring-1 ring-[var(--color-violet-500)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--color-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck
                          className={`w-4 h-4 shrink-0 ${
                            selectedExistingId === resume.id ? 'text-[var(--color-violet-600)]' : 'text-[var(--color-ink-300)]'
                          }`}
                        />
                        <span className="text-xs font-semibold text-[var(--color-ink-900)] truncate">
                          {resume.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-ink-300)] shrink-0 font-mono">
                        #{resume.id}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-ink-500)] italic">
                  No resumes saved yet. Switch to &ldquo;Upload New&rdquo; above.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: JOB DESCRIPTION (Only for Job Match) */}
      {analysisMode === 'job_match' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-violet-600)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <div>
                  <CardTitle>Target Job Description</CardTitle>
                  <CardDescription>Role responsibilities & requirements</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteJD}
                  className="text-xs text-[var(--color-violet-600)] hover:text-[var(--color-violet-700)] font-medium flex items-center gap-1 hover:underline"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste
                </button>
                {jobDescription && (
                  <>
                    <span className="text-[var(--border-default)]">|</span>
                    <button
                      type="button"
                      onClick={handleClearJD}
                      className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] font-medium"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Target Job Title"
                required
                id="job-title"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />

              <Input
                label="Company Name"
                id="company-name"
                placeholder="e.g. Stripe (optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />
            </div>

            <Textarea
              label="Job Description Text"
              required
              id="job-description"
              rows={7}
              showCharCount
              placeholder="Paste the full job listing, responsibilities, technical requirements, and required qualifications here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              error={jdError || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* SUBMIT / EXECUTE */}
      <Card className="border-[var(--color-violet-100)] bg-gradient-to-br from-[var(--color-violet-50)]/30 via-[var(--color-surface)] to-[var(--color-canvas)]">
        <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[var(--color-ink-900)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-violet-600)]" />
              {analysisMode === 'job_match'
                ? 'Ready for ATS Compatibility Scan'
                : 'Ready for General Resume Quality Scan'}
            </h4>
            <p className="text-xs text-[var(--color-ink-500)] leading-relaxed max-w-lg">
              {analysisMode === 'job_match'
                ? 'The AI screening engine will extract skills, cross-reference requirements against the resume, and calculate the compatibility index.'
                : 'The screening engine will analyze resume quality, identify demonstrable skills, evaluate formatting, and generate targeted recommendations.'}
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8 font-semibold shadow-[var(--shadow-violet)]"
            disabled={isAnalyzing}
            isLoading={isAnalyzing}
            onClick={handleSubmitAnalysis}
            rightIcon={!isAnalyzing ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            {isAnalyzing
              ? (analysisStepLabel || 'Analyzing...')
              : (analysisMode === 'job_match' ? 'Run Compatibility Scan' : 'Run General Resume Check')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
