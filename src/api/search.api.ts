import { request } from './client.js';
import type { Category, EventCard, Tag } from '../types/api.js';

export interface SearchResultsResponse {
  items?: string[];
  events?: EventCard[];
  categories?: Category[];
  tags?: Tag[];
}

export async function searchAll(query: string, limit = 8): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return request<SearchResultsResponse>(`/api/search?${params.toString()}`);
}
