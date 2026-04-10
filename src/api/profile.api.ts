import { request } from './client.js';
import type { ApiError, User } from '../types/api.js';

export async function getMe(): Promise<User> {
  return request('/api/me') as Promise<User>;
}

export async function getMeOrNull(): Promise<User | null> {
  try {
    return await getMe();
  } catch (error) {

    if (error instanceof Error && 'status' in error && (error.status === 401) || (error.status ===  404)) {
      return null;
    }

    throw error;
  }
}
