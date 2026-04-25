import { createJsonResponse } from './http.js';

export function createOfflineApiFallback(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === '/api/me') {
    return createJsonResponse(JSON.stringify({ error: 'Offline' }), 401);
  }

  if (url.pathname === '/api/home') {
    return createJsonResponse(JSON.stringify({
      featuredEvents: [],
      categories: [],
      collections: [],
    }));
  }

  if (url.pathname === '/api/categories') {
    return createJsonResponse(JSON.stringify({ items: [] }));
  }

  if (url.pathname === '/api/search') {
    return createJsonResponse(JSON.stringify({
      items: [],
    }));
  }

  if (url.pathname === '/api/events') {
    return createJsonResponse(JSON.stringify({
      items: [],
      total: 0,
      limit: 0,
      offset: 0,
    }));
  }

  return createJsonResponse(JSON.stringify({ error: 'Offline' }), 404);
}
