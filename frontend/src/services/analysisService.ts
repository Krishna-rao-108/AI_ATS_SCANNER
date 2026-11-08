import { apiClient } from './apiClient';
import type {
  AnalysisRequest,
  AnalysisApiResponse,
  AnalysisHistoryRecord,
  StoredAnalysisRecord,
  ResumeTailorRequest,
  ResumeTailorResponse,
  DownloadTailoredDocumentRequest,
  CoverLetterRequest,
  CoverLetterResponse,
} from '../types/analysis';
import { parseAnalysisResult } from '../lib/utils';

const RECENT_ANALYSES_KEY = 'ats_recent_analyses_session';

export const analysisService = {
  async runAnalysis(data: AnalysisRequest): Promise<AnalysisApiResponse> {
    const response = await apiClient.post<AnalysisApiResponse>('/api/analysis/', data);
    return response;
  },

  // Save successful analysis in session history for seamless navigation & offline fallback
  saveSessionRecord(record: StoredAnalysisRecord): void {
    try {
      const existing = this.getSessionRecords();
      const filtered = existing.filter((item) => item.id !== record.id);
      const updated = [record, ...filtered].slice(0, 20);
      sessionStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore session storage errors
    }
  },

  getSessionRecords(): StoredAnalysisRecord[] {
    try {
      const raw = sessionStorage.getItem(RECENT_ANALYSES_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getSessionRecordById(id: number): StoredAnalysisRecord | null {
    const records = this.getSessionRecords();
    return records.find((r) => r.id === id) || null;
  },

  /**
   * Fetches persisted analysis history from the FastAPI backend database.
   * Maps backend payloads to normalized StoredAnalysisRecord objects.
   */
  async getBackendHistory(): Promise<StoredAnalysisRecord[]> {
    const records = await apiClient.get<AnalysisHistoryRecord[]>('/api/analysis/');
    return records.map((rec) => ({
      id: rec.id,
      resume_id: rec.resume_id,
      jd_id: rec.jd_id,
      analysis_type: rec.analysis_type,
      resume_title: rec.resume_title,
      jd_title: rec.jd_title,
      result_data: parseAnalysisResult(rec.result),
      created_at: new Date().toISOString(),
    }));
  },

  /**
   * Fetches single analysis record by ID from the backend.
   */
  async getAnalysisById(id: number): Promise<StoredAnalysisRecord> {
    const rec = await apiClient.get<AnalysisHistoryRecord>(`/api/analysis/${id}`);
    return {
      id: rec.id,
      resume_id: rec.resume_id,
      jd_id: rec.jd_id,
      analysis_type: rec.analysis_type,
      resume_title: rec.resume_title,
      jd_title: rec.jd_title,
      result_data: parseAnalysisResult(rec.result),
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Generates tailored resume bullets using actual resume content and job requirements.
   */
  async tailorResume(data: ResumeTailorRequest): Promise<ResumeTailorResponse> {
    return await apiClient.post<ResumeTailorResponse>('/api/analysis/tailor', data);
  },

  /**
   * Generates and downloads real ATS-friendly PDF or DOCX file with user edits preserved.
   */
  async downloadTailoredDocument(data: DownloadTailoredDocumentRequest): Promise<{ blob: Blob; filename: string }> {
    return await apiClient.downloadBlob('/api/analysis/tailor/download', data);
  },

  /**
   * Generates tailored cover letter using candidate qualifications via Prune AI.
   */
  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    return await apiClient.post<CoverLetterResponse>('/api/analysis/cover-letter', data);
  },
};
