import { apiClient } from './apiClient';
import type { JobDescriptionCreate, JobDescriptionResponse } from '../types/jd';

export const jdService = {
  async createJobDescription(data: JobDescriptionCreate): Promise<JobDescriptionResponse> {
    return apiClient.post<JobDescriptionResponse>('/api/jd/', data);
  },
};
