import { request } from './client.js';

export interface SearchResultsResponse {
  items: string[];
}

export async function searchAll(query: string, limit = 5): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return request<SearchResultsResponse>(`/api/search?${params.toString()}`);
}
