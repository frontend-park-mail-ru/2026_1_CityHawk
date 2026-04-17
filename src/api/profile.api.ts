import { applyCsrfHeader, normalizeApiResponse, request } from './client.js';
import { API_BASE_URL } from './config.js';
import type { ApiError, UpdateProfilePayload, User } from '../types/api.js';

export async function getMe(): Promise<User> {
  return request('/api/me') as Promise<User>;
}

export async function getMeOrNull(): Promise<User | null> {
  try {
    // Lightweight auth probe for public pages:
    // avoid refresh cascade when user is simply not logged in.
    return await request<User>('/api/me', {}, false);
  } catch (error) {
    const apiError = error as ApiError;
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (apiError?.status === 400
      || apiError?.status === 401
      || apiError?.status === 403
      || apiError?.status === 404
      || message.includes('missing access token')
      || message.includes('unauthorized')) {
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

export async function updateProfileMultipart(
  payload: UpdateProfilePayload = {},
  avatarFile?: File,
): Promise<User> {
  const formData = new FormData();

  if (payload.username !== undefined) {
    formData.append('username', payload.username);
  }
  if (payload.email !== undefined) {
    formData.append('email', payload.email);
  }
  if (payload.userSurname !== undefined) {
    formData.append('userSurname', payload.userSurname);
  }
  if (payload.birthday !== undefined) {
    formData.append('birthday', payload.birthday);
  }
  if (payload.cityId !== undefined) {
    formData.append('cityId', payload.cityId);
  }
  if (payload.avatarUrl !== undefined) {
    formData.append('avatarUrl', payload.avatarUrl);
  }
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }
  const headers = new Headers();
  applyCsrfHeader(headers, 'PATCH');

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = await response.json() as { error?: string };
      if (typeof errorData?.error === 'string' && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    const error: ApiError = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as User;
  return normalizeApiResponse(data);
}
