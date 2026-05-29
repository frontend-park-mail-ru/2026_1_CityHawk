import { applyCsrfHeader, normalizeApiResponse, request } from './client.js';
import { API_BASE_URL } from './config.js';
import { translateApiErrorMessage } from './errors.js';
import type {
  ApiError,
  EventDetails,
  EventIdResponse,
  EventPayload,
  EventsQueryParams,
  PaginatedResponse,
  EventCard,
} from '../types/api.js';

export async function getEvents(
  params: EventsQueryParams = {},
): Promise<PaginatedResponse<EventCard>> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<PaginatedResponse<EventCard>>(`/api/events${suffix}`);
}

export async function getEventById(eventId: string | number): Promise<EventDetails> {
  return request<EventDetails>(`/api/events/${eventId}`);
}

export async function createEvent(payload: EventPayload): Promise<EventIdResponse> {
  return request<EventIdResponse>('/api/events', {
    method: 'POST',
    body: payload,
  });
}

export async function updateEvent(
  eventId: string | number,
  payload: Partial<EventPayload>,
): Promise<EventDetails> {
  return request<EventDetails>(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: payload,
  });
}

async function clearEventCache(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(async (cacheName) => {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    await Promise.all(
      requests
        .filter((cachedRequest) => {
          const url = new URL(cachedRequest.url);
          return url.pathname.startsWith('/api/events')
            || url.pathname.startsWith('/api/me/favorites');
        })
        .map((cachedRequest) => cache.delete(cachedRequest)),
    );
  }));
}

export async function deleteEvent(eventId: string | number): Promise<{ ok: true }> {
  const response = await request<{ ok: true }>(`/api/events/${eventId}`, {
    method: 'DELETE',
  });

  await clearEventCache().catch(() => {});

  return response;
}

function appendJsonField(formData: FormData, key: string, value: unknown): void {
  formData.append(key, JSON.stringify(value));
}

async function requestMultipart<TResponse>(
  path: string,
  method: 'POST' | 'PATCH',
  payload: EventPayload,
  imageFiles: File[] = [],
): Promise<TResponse> {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('shortDescription', payload.shortDescription);
  formData.append('fullDescription', payload.fullDescription);
  formData.append('ageLimit', String(payload.ageLimit));
  formData.append('sourceUrl', payload.sourceUrl || '');
  appendJsonField(formData, 'categoryIds', payload.categoryIds || []);
  appendJsonField(formData, 'tagIds', payload.tagIds || []);
  appendJsonField(formData, 'imageUrls', payload.imageUrls || []);
  appendJsonField(formData, 'sessions', payload.sessions || []);

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });
  const headers = new Headers();
  applyCsrfHeader(headers, method);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorDetails: Record<string, string> | undefined;

    try {
      const errorData = await response.json() as { error?: string; details?: Record<string, string> };
      if (typeof errorData?.error === 'string' && errorData.error) {
        errorMessage = errorData.error;
      }
      if (errorData?.details && typeof errorData.details === 'object') {
        errorDetails = errorData.details;
        const firstDetail = Object.values(errorData.details).find((value) => typeof value === 'string' && value);
        if (firstDetail) {
          errorMessage = `${errorMessage}: ${firstDetail}`;
        }
      }
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    const error: ApiError = new Error(translateApiErrorMessage(errorMessage, response.status));
    error.status = response.status;
    if (errorDetails) {
      error.details = errorDetails;
    }
    throw error;
  }

  const data = await response.json() as TResponse;
  return normalizeApiResponse(data);
}

export async function createEventMultipart(
  payload: EventPayload,
  imageFiles: File[] = [],
): Promise<EventIdResponse> {
  return requestMultipart<EventIdResponse>('/api/events', 'POST', payload, imageFiles);
}

export async function updateEventMultipart(
  eventId: string | number,
  payload: EventPayload,
  imageFiles: File[] = [],
): Promise<EventDetails> {
  return requestMultipart<EventDetails>(`/api/events/${eventId}`, 'PATCH', payload, imageFiles);
}
