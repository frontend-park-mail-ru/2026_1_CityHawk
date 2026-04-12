import { request } from './client.js';
import type {
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
): Promise<EventIdResponse | null> {
  return request<EventIdResponse | null>(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteEvent(eventId: string | number): Promise<null> {
  return request<null>(`/api/events/${eventId}`, {
    method: 'DELETE',
  });
}
