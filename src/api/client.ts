import { API_BASE_URL } from './config.js';
import { refresh } from './auth.api.js';
import type { ApiError } from '../types/api.js';

type RequestBody = object | string | number | boolean | null | RequestBody[];

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody;
}

interface ErrorResponseBody {
  error?: string;
}

export async function request<T = RequestBody>(
  path: string,
  options: RequestOptions = {},
  retry = true,
): Promise<T> {
  
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && retry) {
    const refreshed = await refresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = await response.json() as ErrorResponseBody;
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

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
