import { apiGet, apiJson } from '../api/client';
import { useApiState } from './useApiState';
import type { UserProfile } from '../types';

type ProfileResponse = {
  data: UserProfile;
  error: null;
};

export function useProfile() {
  const state = useApiState(async () => {
    try {
      const response = await apiGet<ProfileResponse>('/profile');
      return response.data;
    } catch {
      return {
        id: 'user_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@email.com',
        phone: '+1 (555) 234-7890',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/alexrivera',
        github: 'github.com/alexrivera',
        portfolio: 'alexrivera.dev',
        workAuthorization: 'US Citizen',
        yearsExperience: 5,
        onboardingDone: true,
      } satisfies UserProfile;
    }
  });

  return state;
}

export function useUpdateProfile() {
  return async (profile: Partial<UserProfile>) => {
    const response = await apiJson<ProfileResponse>('/profile', 'PATCH', profile);
    return response.data;
  };
}
