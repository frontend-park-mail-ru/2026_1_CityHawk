import { request } from './client.js';

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
