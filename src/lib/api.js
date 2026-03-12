import { API_BASE_URL } from './config.js';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-store.js';

/**
 * Выполняет авторизованный API-запрос и при необходимости один раз повторяет его после refresh токена.
 *
 * @param {string} path Путь API относительно базового URL.
 * @param {RequestInit & { body?: unknown }} [options] Параметры fetch-запроса.
 * @param {boolean} [retry] Нужно ли повторять запрос после refresh.
 * @returns {Promise<any>}
 */
async function request(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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

/**
 * Отправляет данные для входа и сохраняет полученный access token.
 *
 * @param {{ email: string, password: string }} payload Данные для авторизации.
 * @returns {Promise<any>}
 */
export async function login(payload) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: payload,
  }, false);

  setAccessToken(data.access_token);
  return data;
}

/**
 * Отправляет данные регистрации и сохраняет полученный access token.
 *
 * @param {{ username: string, email: string, password: string }} payload Данные для регистрации.
 * @returns {Promise<any>}
 */
export async function register(payload) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: payload,
  }, false);

  setAccessToken(data.access_token);
  return data;
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
 * Загружает профиль текущего авторизованного пользователя.
 *
 * @returns {Promise<any>}
 */
export async function getMe() {
  return request('/me');
}

/**
 * Загружает список мест.
 *
 * @returns {Promise<any>}
 */
export async function getPlaces() {
  return request('/places');
}

/**
 * Загружает данные для главной страницы.
 *
 * @returns {Promise<any>}
 */
export async function getHome() {
  return request('/api/home');
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
