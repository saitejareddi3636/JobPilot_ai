import { apiGet } from '../api/client';
import { useApiState } from './useApiState';
import type { ActivityItem, DashboardStats } from '../types';

type StatsResponse = {
  data: DashboardStats;
  error: null;
};

type ActivityResponse = {
  data: ActivityItem[];
  error: null;
};

export function useDashboardStats() {
  return useApiState(async () => {
    try {
      const response = await apiGet<StatsResponse>('/stats');
      return response.data;
    } catch {
      return {
        totalApplications: 0,
        applicationsThisWeek: 0,
        timeSavedMinutes: 0,
        interviewRate: 0,
        avgFieldsPerApp: 0,
        successRate: 0,
      } satisfies DashboardStats;
    }
  });
}

export function useActivityFeed(limit = 10) {
  return useApiState(async () => {
    try {
      const response = await apiGet<ActivityResponse>(`/stats/activity?limit=${limit}`);
      return response.data;
    } catch {
      return [] as ActivityItem[];
    }
  }, [limit]);
}
