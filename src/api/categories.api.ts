import { request } from './client.js';
import type {
  CategoryListResponse,
  EventCard,
  PaginatedResponse,
} from '../types/api.js';

export async function getCategories(): Promise<CategoryListResponse> {
  return request<CategoryListResponse>('/api/categories');
}

export async function getCategoryEvents(
  categoryId: string,
): Promise<PaginatedResponse<EventCard>> {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set('categoryId', String(categoryId));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<PaginatedResponse<EventCard>>(`/api/events${suffix}`);
}
