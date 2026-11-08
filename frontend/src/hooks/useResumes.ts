import { useState, useEffect, useCallback } from 'react';
import { resumeService } from '../services/resumeService';
import type { Resume } from '../types/resume';

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resumeService.getResumes();
      setResumes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const deleteResume = async (id: number) => {
    try {
      await resumeService.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to delete resume');
    }
  };

  return {
    resumes,
    loading,
    error,
    refresh: fetchResumes,
    deleteResume,
  };
}
