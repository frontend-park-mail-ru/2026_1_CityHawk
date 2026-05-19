import { request } from './client.js';
import type { NotificationsResponse } from '../types/api.js';

export interface NotificationsQueryParams {
  type?: 'all' | 'invitations' | 'system';
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function getMyNotifications(
  params: NotificationsQueryParams = {},
): Promise<NotificationsResponse> {
  const query = new URLSearchParams();

  if (params.type) {
    query.set('type', params.type);
  }
  if (typeof params.unreadOnly === 'boolean') {
    query.set('unreadOnly', String(params.unreadOnly));
  }
  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }
  if (typeof params.offset === 'number') {
    query.set('offset', String(params.offset));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<NotificationsResponse>(`/api/me/notifications${suffix}`);
}

export async function markNotificationRead(notificationId: string): Promise<{ ok: true; unreadCount: number }> {
  return request<{ ok: true; unreadCount: number }>(
    `/api/me/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'POST' },
  );
}

export async function markAllNotificationsRead(): Promise<{ ok: true; unreadCount: number }> {
  return request<{ ok: true; unreadCount: number }>('/api/me/notifications/read-all', {
    method: 'POST',
  });
}
