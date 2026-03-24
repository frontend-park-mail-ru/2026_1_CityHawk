import { API_BASE_URL } from './config.js';
import { request } from './client.js';
import { clearAccessToken, setAccessToken } from '../modules/session/session.store.js';

/**
 * Отправляет данные для входа и запрашивает access token через refresh.
 *
 * @param {{ email: string, password: string }} payload Данные для авторизации.
 * @returns {Promise<any>}
 */
export async function login(payload) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: payload,
  }, false);

  const refreshed = await refresh();
  if (!refreshed) {
    const error = new Error('Не удалось обновить токен после входа');
    error.status = 401;
    throw error;
  }

  return data;
}

/**
 * Отправляет данные регистрации.
 *
 * @param {{ username: string, email: string, password: string }} payload Данные для регистрации.
 * @returns {Promise<any>}
 */
export async function register(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: payload,
  }, false);
}

/**
 * Пытается обновить access token с помощью refresh-cookie.
 *
 * @returns {Promise<boolean>}
 */
export async function refresh() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      clearAccessToken();
      return false;
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
}

/**
 * Завершает текущую сессию и очищает локальный access token.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  clearAccessToken();
}
