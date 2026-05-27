import { apiGet, apiJson } from '../api/client';
import { useApiState } from './useApiState';
import { useAuth } from '../auth/useAuth';
import type { UserProfile } from '../types';

type ProfileResponse = {
  data: UserProfile;
  error: null;
};

export function useProfile() {
  const { user } = useAuth();

  const state = useApiState(async () => {
    try {
      const response = await apiGet<ProfileResponse>('/profile');
      return response.data;
    } catch {
      const name = (user?.user_metadata?.full_name as string | undefined)
        ?? user?.email?.split('@')[0]
        ?? 'User';
      const email = user?.email ?? '';
      return {
        id: user?.id ?? 'user_01',
        name,
        email,
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
        workAuthorization: '',
        yearsExperience: 0,
        onboardingDone: true,
      } satisfies UserProfile;
    }
  }, [user?.id]);

  return state;
}

export function useUpdateProfile() {
  return async (profile: Partial<UserProfile>) => {
    const response = await apiJson<ProfileResponse>('/profile', 'PATCH', profile);
    return response.data;
  };
}
