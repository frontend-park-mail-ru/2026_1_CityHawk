import { cacheUrl, extractAssetUrlsFromHtml } from './cache-utils.js';

interface PrecacheShellOptions {
  shellCacheName: string;
  appShellUrls: string[];
  handlebarsCdnUrl: string;
  origin: string;
}

export async function precacheShell({
  shellCacheName,
  appShellUrls,
  handlebarsCdnUrl,
  origin,
}: PrecacheShellOptions): Promise<void> {
  const shellCache = await caches.open(shellCacheName);
  await cacheUrl(shellCache, '/index.html', origin, { cache: 'no-store' });

  let html = '';
  const indexResponse = await shellCache.match(new URL('/index.html', origin).toString());
  if (indexResponse) {
    html = await indexResponse.text();
  }

  const assetUrls = extractAssetUrlsFromHtml(html);
  const uniqueUrls = Array.from(new Set([
    ...appShellUrls,
    ...assetUrls,
  ]));

  await Promise.allSettled(uniqueUrls.map((url) => cacheUrl(shellCache, url, origin)));
  await cacheUrl(shellCache, handlebarsCdnUrl, origin, { mode: 'no-cors' });
}
