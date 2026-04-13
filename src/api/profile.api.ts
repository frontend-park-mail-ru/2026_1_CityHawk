import { request } from './client.js';
import type { ApiError, UpdateProfilePayload, User } from '../types/api.js';

export async function getMe(): Promise<User> {
  return request('/api/me') as Promise<User>;
}

export async function getMeOrNull(): Promise<User | null> {
  try {
    return await getMe();
  } catch (error) {
    const apiError = error as ApiError;

    if (apiError?.status === 401 || apiError?.status === 404) {
      return null;
    }

    if (error instanceof Error && !apiError?.status) {
      return null;
    }

    throw error;
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return request<User>('/api/me', {
    method: 'PATCH',
    body: payload,
  });
}
