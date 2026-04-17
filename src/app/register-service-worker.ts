const SERVICE_WORKER_URL = '/service-worker.js';

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1';
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Avoid stale chunk issues in local development caused by cached app shell/assets.
  if (isLocalhostHost(window.location.hostname)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error: Error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
