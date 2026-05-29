import { createJsonResponse } from './http.js';

function createPaginatedResponse<T>(items: T[] = []): Response {
  return createJsonResponse(JSON.stringify({
    items,
    total: items.length,
    limit: items.length,
    offset: 0,
  }));
}

function createEventDetailsFallback(eventId: string): Response {
  return createJsonResponse(JSON.stringify({
    id: eventId,
    title: 'Событие временно недоступно офлайн',
    shortDescription: 'Открой это событие онлайн один раз, и затем оно будет доступно из кэша.',
    fullDescription: 'Сейчас у нас нет сохраненной версии этого события на устройстве. Когда сеть появится, страница загрузится автоматически.',
    ageLimit: 0,
    sourceUrl: '',
    author: {
      id: '',
      username: 'CityHawk',
    },
    categories: [],
    tags: [],
    images: [],
    sessions: [],
    createdAt: '',
    updatedAt: '',
    isFavorite: false,
    isOwner: false,
    coverImageUrl: '/public/static/img/photo.jpeg',
  }));
}

export function createOfflineApiFallback(request: Request): Response {
  const url = new URL(request.url);
  const eventMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);

  if (url.pathname === '/api/me') {
    return createJsonResponse(JSON.stringify({ error: 'Нет соединения' }), 401);
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

  if (url.pathname === '/api/tags') {
    return createJsonResponse(JSON.stringify({ items: [] }));
  }

  if (url.pathname === '/api/search') {
    return createJsonResponse(JSON.stringify({
      items: [],
    }));
  }

  if (url.pathname === '/api/events') {
    return createPaginatedResponse();
  }

  if (eventMatch) {
    return createEventDetailsFallback(decodeURIComponent(eventMatch[1] || ''));
  }

  if (url.pathname === '/api/me/favorites') {
    return createPaginatedResponse();
  }

  if (url.pathname === '/api/me/followers' || url.pathname === '/api/me/following') {
    return createPaginatedResponse();
  }

  if (url.pathname === '/api/map/collections') {
    return createJsonResponse(JSON.stringify({
      items: [],
      total: 0,
      limit: 0,
      offset: 0,
    }));
  }

  if (url.pathname === '/api/map/filters') {
    return createJsonResponse(JSON.stringify({
      tags: [],
      datePresets: [],
      sortOptions: [],
    }));
  }

  if (/^\/api\/map\/collections\/[^/]+\/spots$/.test(url.pathname)) {
    return createJsonResponse(JSON.stringify({
      collection: {
        id: '',
        title: 'Офлайн',
      },
      items: [],
      total: 0,
      limit: 0,
      offset: 0,
    }));
  }

  return createJsonResponse(JSON.stringify({ error: 'Нет соединения' }), 404);
}
