import { request } from './client.js';
import type { ShareLinkResponse } from '../types/api.js';

export async function createEventShareLink(
  eventId: string,
  source = 'event_page',
): Promise<ShareLinkResponse> {
  return request<ShareLinkResponse>(`/api/events/${encodeURIComponent(eventId)}/share-links`, {
    method: 'POST',
    body: { source },
  });
}

export async function createCollectionShareLink(
  collectionId: string,
  source = 'collection_page',
): Promise<ShareLinkResponse> {
  return request<ShareLinkResponse>(`/api/collections/${encodeURIComponent(collectionId)}/share-links`, {
    method: 'POST',
    body: { source },
  });
}
