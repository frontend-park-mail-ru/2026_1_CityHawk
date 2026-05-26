import { request } from './client.js';
import type {
  EventCard,
  PaginatedResponse,
} from '../types/api.js';

export interface InvitedEventsQueryParams {
  limit?: number;
  offset?: number;
}

export async function getMyInvitedEvents(
  params: InvitedEventsQueryParams = {},
): Promise<PaginatedResponse<EventCard>> {
  const query = new URLSearchParams();

  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }
  if (typeof params.offset === 'number') {
    query.set('offset', String(params.offset));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<PaginatedResponse<EventCard>>(`/api/me/notifications/events${suffix}`);
}
