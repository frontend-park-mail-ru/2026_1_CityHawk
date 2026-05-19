import { request } from './client.js';
import type {
  CreateSupportMessagePayload,
  CreateSupportTicketPayload,
  SupportMessage,
  SupportMessageListResponse,
  SupportStats,
  SupportStatsQueryParams,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketQueryParams,
  UpdateSupportTicketPayload,
  UpdateSupportTicketStatusPayload,
} from '../types/api.js';

function buildQuery(params: Record<string, string | number | undefined> = {}): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : '';
}

export function createSupportTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
  return request<SupportTicket>('/api/support/tickets', {
    method: 'POST',
    body: payload,
  });
}

export function getSupportTickets(
  params: SupportTicketQueryParams = {},
): Promise<SupportTicketListResponse> {
  return request<SupportTicketListResponse>(`/api/support/tickets${buildQuery(params)}`);
}

export function getSupportTicket(ticketId: string): Promise<SupportTicket> {
  return request<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticketId)}`);
}

export function updateSupportTicket(
  ticketId: string,
  payload: UpdateSupportTicketPayload,
): Promise<SupportTicket> {
  return request<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function updateSupportTicketStatus(
  ticketId: string,
  payload: UpdateSupportTicketStatusPayload,
): Promise<SupportTicket> {
  return request<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    body: payload,
  });
}

export function getSupportMessages(ticketId: string): Promise<SupportMessageListResponse> {
  return request<SupportMessageListResponse>(
    `/api/support/tickets/${encodeURIComponent(ticketId)}/messages`,
  );
}

export function createSupportMessage(
  ticketId: string,
  payload: CreateSupportMessagePayload,
): Promise<SupportMessage> {
  return request<SupportMessage>(
    `/api/support/tickets/${encodeURIComponent(ticketId)}/messages`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export function getSupportStats(
  params: SupportStatsQueryParams = {},
): Promise<SupportStats> {
  return request<SupportStats>(`/api/support/stats${buildQuery(params)}`);
}
