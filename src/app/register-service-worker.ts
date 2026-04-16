const SERVICE_WORKER_URL = '/service-worker.js';

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error: Error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
