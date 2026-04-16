import { isSuccessfulResponse } from '../http.js';

interface IsStaticAssetRequestOptions {
  request: Request;
  url: URL;
  origin: string;
  handlebarsCdnUrl: string;
}

export function isStaticAssetRequest({
  request,
  url,
  origin,
  handlebarsCdnUrl,
}: IsStaticAssetRequestOptions): boolean {
  if (url.href === handlebarsCdnUrl) {
    return true;
  }

  if (request.destination === 'document') {
    return false;
  }

  if (url.origin === origin) {
    return (
      url.pathname.startsWith('/public/')
      || url.pathname.startsWith('/src/')
      || url.pathname === '/runtime-config.js'
      || request.destination === 'script'
      || request.destination === 'style'
      || request.destination === 'image'
      || request.destination === 'font'
    );
  }

  return url.href === handlebarsCdnUrl;
}

export async function cacheFirstStaticStrategy(
  request: Request,
  staticCacheName: string,
): Promise<Response> {
  const cache = await caches.open(staticCacheName);
  const cachedResponse = await cache.match(request.url);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (isSuccessfulResponse(response)) {
    await cache.put(request.url, response.clone());
  }

  return response;
}
