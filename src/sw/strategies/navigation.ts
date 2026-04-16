export async function networkFirstNavigationStrategy(
  request: Request,
  shellCacheName: string,
  origin: string,
): Promise<Response> {
  const cache = await caches.open(shellCacheName);

  try {
    const response = await fetch(request);

    if (response.ok && request.url.startsWith(origin)) {
      await cache.put('/index.html', response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await cache.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
