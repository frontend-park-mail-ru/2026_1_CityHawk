import { request } from './client.js';

export interface SearchSuggestionItem {
  id?: string;
  type?: string;
  label?: string;
  title?: string;
  name?: string;
}

export interface SearchResultsResponse {
  items: Array<string | SearchSuggestionItem>;
}

export async function searchAll(query: string, limit = 5): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return request<SearchResultsResponse>(`/api/search?${params.toString()}`);
}
