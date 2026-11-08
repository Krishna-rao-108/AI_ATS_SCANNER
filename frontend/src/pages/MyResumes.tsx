import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  FileCheck,
  Plus,
  AlertCircle,
  FileSearch,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResumes } from '../hooks/useResumes';
import { resumeService } from '../services/resumeService';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { formatBytes } from '../lib/utils';
import type { ResumeDetail } from '../types/resume';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const MyResumes: React.FC = () => {
  const navigate = useNavigate();
  const { resumes, loading, error, refresh, deleteResume } = useResumes();
  const { success: toastSuccess, error: toastError } = useToast();

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View details modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [activeResumeDetail, setActiveResumeDetail] = useState<ResumeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectFile = (file: File) => {
    setUploadError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
      setUploadError('Only PDF (.pdf) and Word (.docx) files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size (${formatBytes(file.size)}) exceeds the 5 MB maximum limit.`);
      return;
    }
    setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await resumeService.uploadResume(uploadFile);
      toastSuccess('Resume uploaded and parsed successfully');
      setUploadModalOpen(false);
      setUploadFile(null);
      await refresh();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload resume. Please verify file integrity.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDetail = async (id: number) => {
    setViewModalOpen(true);
    setLoadingDetail(true);
    setActiveResumeDetail(null);
    setCopiedText(false);
    try {
      const detail = await resumeService.getResume(id);
      setActiveResumeDetail(detail);
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch resume content');
      setViewModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopyExtractedText = () => {
    if (!activeResumeDetail?.content) return;
    navigator.clipboard.writeText(activeResumeDetail.content);
    setCopiedText(true);
    toastSuccess('Extracted text copied to clipboard');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResume(resumeToDelete.id);
      toastSuccess(`"${resumeToDelete.title}" deleted.`);
      setDeleteModalOpen(false);
      setResumeToDelete(null);
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete resume');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink-900)] tracking-tight">
              Candidate Resume Library
            </h2>
            <Badge variant="outline" size="sm">
              PostgreSQL Stored
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-0.5">
            Manage uploaded candidate documents, inspect backend extracted text, and run ATS evaluations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setUploadModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Upload New Resume
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Resumes List Table / Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Stored Documents ({resumes.length})</CardTitle>
              <CardDescription>Multi-tenant verified files in database</CardDescription>
            </div>
            <span className="text-xs text-[var(--color-ink-500)] font-medium">
              Maximum 5 MB per file
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : resumes.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {resumes.map((resume) => {
                const isPdf = resume.title.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={resume.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-raised)]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[var(--color-ink-900)] truncate">
                            {resume.title}
                          </h4>
                          <Badge variant={isPdf ? 'violet' : 'info'} size="sm">
                            {isPdf ? 'PDF' : 'DOCX'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-ink-500)] mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[11px]">ID #{resume.id}</span>
                          <span>•</span>
                          <span>Parsed text available</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(resume.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect Text
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/analyze')}
                        title="Screen against job description"
                        className="text-[var(--color-violet-600)] hover:text-[var(--color-violet-700)] hover:bg-[var(--color-violet-50)]"
                        leftIcon={<FileSearch className="w-3.5 h-3.5" />}
                      >
                        Analyze
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/tailor')}
                        title="Tailor this resume"
                        className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        Tailor
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResumeToDelete({ id: resume.id, title: resume.title });
                          setDeleteModalOpen(true);
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        aria-label="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title="No resumes uploaded"
                description="Upload candidate resumes in PDF or Word format to begin running ATS screenings and tailoring workflows."
                actionLabel="Upload First Resume"
                onAction={() => setUploadModalOpen(true)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadFile(null);
          setUploadError(null);
        }}
        title="Upload Candidate Resume"
        description="Select a PDF or DOCX document (maximum 5 MB)."
      >
        <div className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {!uploadFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--color-violet-400)] rounded-[var(--radius-lg)] p-8 text-center cursor-pointer bg-[var(--color-canvas)] hover:bg-[var(--color-violet-50)]/30 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSelectFile(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-[var(--color-violet-600)] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[var(--color-ink-900)]">Choose file or drag here</p>
              <p className="text-[11px] text-[var(--color-ink-500)] mt-1">PDF or DOCX up to 5 MB</p>
            </div>
          ) : (
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-violet-200)] bg-[var(--color-violet-50)]/30 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <FileCheck className="w-5 h-5 text-[var(--color-violet-600)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-ink-900)] truncate">{uploadFile.name}</p>
                  <p className="text-[11px] text-[var(--color-ink-500)]">{formatBytes(uploadFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadFile(null)}
                className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] font-medium"
              >
                Change
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadModalOpen(false);
                setUploadFile(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!uploadFile || isUploading}
              isLoading={isUploading}
              onClick={handleUploadSubmit}
            >
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW EXTRACTED TEXT MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={activeResumeDetail?.title || 'Resume Document Content'}
        description={`Parsed text extracted by backend text parser (ID #${activeResumeDetail?.id || ''})`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {loadingDetail ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <div className="relative">
              <div className="max-h-96 overflow-y-auto p-4 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--color-ink-700)] leading-relaxed whitespace-pre-wrap select-text">
                {activeResumeDetail?.content || 'No readable text content found.'}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyExtractedText}
              disabled={loadingDetail || !activeResumeDetail?.content}
              leftIcon={copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedText ? 'Copied' : 'Copy Text'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-ink-700)] leading-relaxed">
            Deleting <strong className="text-[var(--color-ink-900)]">{resumeToDelete?.title}</strong> will remove the document and its parsed content from PostgreSQL.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Resume
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
