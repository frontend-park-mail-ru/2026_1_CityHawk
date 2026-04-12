import { request } from './client.js';
import type { Category, EventCard, Tag } from '../types/api.js';

export interface SearchResultsResponse {
  events?: EventCard[];
  categories?: Category[];
  tags?: Tag[];
}

export async function searchAll(query: string): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ query });
  return request<SearchResultsResponse>(`/api/search?${params.toString()}`);
}
