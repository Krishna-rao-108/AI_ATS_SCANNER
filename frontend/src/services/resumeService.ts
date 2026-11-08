import { apiClient } from './apiClient';
import type { Resume, ResumeDetail, ResumeUploadResponse, ResumeDeleteResponse } from '../types/resume';

export const resumeService = {
  async getResumes(): Promise<Resume[]> {
    return apiClient.get<Resume[]>('/api/resumes');
  },

  async getResume(id: number): Promise<ResumeDetail> {
    return apiClient.get<ResumeDetail>(`/api/resumes/${id}`);
  },

  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<ResumeUploadResponse>('/api/resumes/upload', formData);
  },

  async deleteResume(id: number): Promise<ResumeDeleteResponse> {
    return apiClient.delete<ResumeDeleteResponse>(`/api/resumes/${id}`);
  },
};
