import { isSuccessfulResponse } from './http.js';

function normalizeCacheKey(url: string, origin: string): string {
  const parsedUrl = new URL(url, origin);
  return parsedUrl.toString();
}

export async function cacheUrl(
  cache: Cache,
  url: string,
  origin: string,
  requestInit?: RequestInit,
): Promise<void> {
  try {
    const request = new Request(url, requestInit);
    const response = await fetch(request);

    if (!isSuccessfulResponse(response)) {
      return;
    }

    await cache.put(normalizeCacheKey(url, origin), response.clone());
  } catch {
    }
}

export function extractAssetUrlsFromHtml(html: string): string[] {
  const matches = Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g));

  return matches
    .map((match) => match[1] || '')
    .filter((value) => value.startsWith('/'))
    .filter((value) => !value.startsWith('//'));
}
