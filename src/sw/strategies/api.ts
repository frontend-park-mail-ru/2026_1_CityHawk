import { createOfflineApiFallback } from '../offline-api-fallbacks.js';

export function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/');
}

export async function networkFirstApiStrategy(
  request: Request,
  dataCacheName: string,
): Promise<Response> {
  const cache = await caches.open(dataCacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return createOfflineApiFallback(request);
  }
}
