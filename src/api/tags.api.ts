import { request } from './client.js';
import type { EventCard, PaginatedResponse, TagListResponse } from '../types/api.js';

export async function getTags(): Promise<TagListResponse> {
  return request<TagListResponse>('/api/tags');
}

export interface TagEventsParams {
  limit?: number;
  offset?: number;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export async function getTagEvents(
  tagId: string,
  params: TagEventsParams = {},
): Promise<PaginatedResponse<EventCard>> {
  const query = new URLSearchParams();
  const normalizedTagID = String(tagId || '').trim();

  if (normalizedTagID) {
    query.set('tagId', normalizedTagID);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<PaginatedResponse<EventCard>>(`/api/events${suffix}`);
}
