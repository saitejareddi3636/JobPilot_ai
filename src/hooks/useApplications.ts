import { apiGet, apiJson } from '../api/client';
import { useApiState } from './useApiState';
import type { Application, ApplicationStatus } from '../types';

type ApplicationsResponse = {
  data: Application[];
  total: number;
  page: number;
  pages: number;
  error: null;
};

type ApplicationFilters = {
  status?: ApplicationStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
};

function buildQuery(filters?: ApplicationFilters) {
  const query = new URLSearchParams();

  if (filters?.status && filters.status !== 'all') {
    query.set('status', filters.status);
  }
  if (filters?.search) {
    query.set('search', filters.search);
  }
  if (filters?.page) {
    query.set('page', String(filters.page));
  }
  if (filters?.limit) {
    query.set('limit', String(filters.limit));
  }

  return query.toString();
}

export function useApplications(filters?: ApplicationFilters) {
  const query = buildQuery(filters);

  return useApiState(async () => {
    try {
      const response = await apiGet<ApplicationsResponse>(`/applications${query ? `?${query}` : ''}`);
      return response;
    } catch {
      return {
        data: [],
        total: 0,
        page: 1,
        pages: 1,
        error: null,
      } satisfies ApplicationsResponse;
    }
  }, [query]);
}

export function useUpdateApplication() {
  return async (id: string, patch: Partial<Pick<Application, 'status' | 'resumeUsed'>>) => {
    const response = await apiJson<{ data: Application; error: null }>(`/applications/${id}`, 'PATCH', patch);
    return response.data;
  };
}
