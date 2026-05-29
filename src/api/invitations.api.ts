import { request } from './client.js';
import type {
  CreateEventInvitationsPayload,
  EventInvitation,
  EventInvitationsResponse,
  EventInviteeSearchResponse,
  InvitationStatus,
} from '../types/api.js';

export async function searchEventInvitees(
  eventId: string,
  query: string,
  limit = 10,
): Promise<EventInviteeSearchResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
  });

  return request<EventInviteeSearchResponse>(
    `/api/events/${encodeURIComponent(eventId)}/invitees/search?${params.toString()}`,
  );
}

export async function createEventInvitations(
  eventId: string,
  payload: CreateEventInvitationsPayload,
): Promise<EventInvitationsResponse> {
  return request<EventInvitationsResponse>(`/api/events/${encodeURIComponent(eventId)}/invitations`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateInvitationStatus(
  invitationId: string,
  status: Extract<InvitationStatus, 'accepted' | 'declined'>,
): Promise<EventInvitation> {
  return request<EventInvitation>(`/api/invitations/${encodeURIComponent(invitationId)}`, {
    method: 'PATCH',
    body: { status },
  });
}
