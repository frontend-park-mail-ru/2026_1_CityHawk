import { request } from './client.js';
import type { EventCard, PaginatedResponse } from '../types/api.js';

export async function addEventToFavorites(eventId: string): Promise<{ ok: true } | null> {
  return request<{ ok: true } | null>(`/api/me/favorites/${encodeURIComponent(eventId)}`, {
    method: 'POST',
  });
}

export async function removeEventFromFavorites(eventId: string): Promise<{ ok: true } | null> {
  return request<{ ok: true } | null>(`/api/me/favorites/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}

export async function getMyFavorites(
  limit = 20,
  offset = 0,
): Promise<PaginatedResponse<EventCard>> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return request<PaginatedResponse<EventCard>>(`/api/me/favorites?${params.toString()}`);
}
