import { apiGet, apiJson } from '../api/client';
import { useApiState } from './useApiState';
import type { Resume } from '../types';

type ResumesResponse = {
  data: Resume[];
  error: null;
};

type ResumeCreateInput = {
  name: string;
  filename: string;
  targetRole?: string;
  tags?: string[];
  sizeBytes?: number;
  mimeType?: string;
};

export function useResumes() {
  return useApiState(async () => {
    try {
      const response = await apiGet<ResumesResponse>('/resumes');
      return response.data;
    } catch {
      return [] as Resume[];
    }
  });
}

export function useUploadResume() {
  return async (input: ResumeCreateInput) => {
    const response = await apiJson<{ data: Resume; error: null }>('/resumes', 'POST', input);
    return response.data;
  };
}

export function useSetDefaultResume() {
  return async (id: string) => {
    const response = await apiJson<{ data: Resume; error: null }>(`/resumes/${id}`, 'PATCH', { isDefault: true });
    return response.data;
  };
}

export function useDeleteResume() {
  return async (id: string) => {
    await apiJson<null>(`/resumes/${id}`, 'DELETE');
  };
}
