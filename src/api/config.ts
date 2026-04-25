declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
      YANDEX_MAPS_API_KEY?: string;
    };
  }
}

function resolveDefaultApiBaseURL(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }

  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  if (isLocalhost) {
    return 'http://localhost:8080';
  }

  return `${protocol}//${hostname}:8080`;
}

export const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || resolveDefaultApiBaseURL();
export const YANDEX_MAPS_API_KEY = String(window.__APP_CONFIG__?.YANDEX_MAPS_API_KEY || '').trim();
