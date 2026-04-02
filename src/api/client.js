import { API_BASE_URL } from './config.js';
import { refresh } from './auth.api.js';

/**
 * Выполняет API-запрос и при необходимости один раз повторяет его после refresh токена.
 *
 * @param {string} path Путь API относительно базового URL.
 * @param {RequestInit & { body?: unknown }} [options] Параметры fetch-запроса.
 * @param {boolean} [retry] Нужно ли повторять запрос после refresh.
 * @returns {Promise<any>}
 */
export async function request(path, options = {}, retry = true) {
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
      return request(path, options, false);
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      if (typeof errorData?.error === 'string' && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
