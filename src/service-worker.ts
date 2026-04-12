/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

export {};

import {
  APP_SHELL_URLS,
  DATA_CACHE,
  HANDLEBARS_CDN_URL,
  SHELL_CACHE,
  STATIC_CACHE,
} from './sw/config.js';
import { precacheShell } from './sw/precache.js';
import {
  isApiRequest,
  networkFirstApiStrategy,
} from './sw/strategies/api.js';
import {
  networkFirstNavigationStrategy,
} from './sw/strategies/navigation.js';
import {
  cacheFirstStaticStrategy,
  isStaticAssetRequest,
} from './sw/strategies/static.js';

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil((async () => {
    await precacheShell({
      shellCacheName: SHELL_CACHE,
      appShellUrls: APP_SHELL_URLS,
      handlebarsCdnUrl: HANDLEBARS_CDN_URL,
      origin: self.location.origin,
    });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const allowedCaches = new Set([SHELL_CACHE, DATA_CACHE, STATIC_CACHE]);

    await Promise.all(
      cacheNames
        .filter((cacheName) => !allowedCaches.has(cacheName))
        .map((cacheName) => caches.delete(cacheName)),
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigationStrategy(request, SHELL_CACHE, self.location.origin));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstApiStrategy(request, DATA_CACHE));
    return;
  }

  if (isStaticAssetRequest({
    request,
    url,
    origin: self.location.origin,
    handlebarsCdnUrl: HANDLEBARS_CDN_URL,
  })) {
    event.respondWith(cacheFirstStaticStrategy(request, STATIC_CACHE));
  }
});
