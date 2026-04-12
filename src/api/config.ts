declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

export const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || 'http://localhost:8080';
