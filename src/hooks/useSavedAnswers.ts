import { apiGet, apiJson } from '../api/client';
import { useApiState } from './useApiState';
import type { SavedAnswer } from '../types';

type SavedAnswersResponse = {
  data: SavedAnswer[];
  error: null;
};

export function useSavedAnswers() {
  return useApiState(async () => {
    try {
      const response = await apiGet<SavedAnswersResponse>('/saved-answers');
      return response.data;
    } catch {
      return [] as SavedAnswer[];
    }
  });
}

export function useCreateSavedAnswer() {
  return async (input: Pick<SavedAnswer, 'question' | 'answer' | 'category'>) => {
    const response = await apiJson<{ data: SavedAnswer; error: null }>('/saved-answers', 'POST', input);
    return response.data;
  };
}

export function useUpdateSavedAnswer() {
  return async (id: string, input: Partial<Pick<SavedAnswer, 'question' | 'answer' | 'category'>>) => {
    const response = await apiJson<{ data: SavedAnswer; error: null }>(`/saved-answers/${id}`, 'PATCH', input);
    return response.data;
  };
}

export function useDeleteSavedAnswer() {
  return async (id: string) => {
    await apiJson<null>(`/saved-answers/${id}`, 'DELETE');
  };
}
