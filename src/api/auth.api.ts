import { request } from './client.js';
import type {
  AuthOkResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../types/api.js';

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: payload,
  }, false);
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: payload,
  }, false);
}

export async function refresh(): Promise<boolean> {
  try {
    const response = await request<AuthOkResponse | null>('/api/auth/refresh', {
      method: 'POST',
    }, false);

    return response?.ok === true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await request<AuthOkResponse>('/api/auth/logout', {
    method: 'POST',
  }, false);
}
