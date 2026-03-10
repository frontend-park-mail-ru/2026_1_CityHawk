import { API_BASE_URL } from './config.js';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-store.js';

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
      // Keep fallback message when response body is not JSON.
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

export async function login(payload) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: payload,
  }, false);

  setAccessToken(data.access_token);
  return data;
}

export async function register(payload) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: payload,
  }, false);

  setAccessToken(data.access_token);
  return data;
}

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

export async function getMe() {
  return request('/me');
}

export async function getPlaces() {
  return request('/places');
}

export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  clearAccessToken();
}
