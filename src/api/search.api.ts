import { request } from './client.js';
import type { FollowUser } from '../types/api.js';

export interface SearchSuggestionItem {
  id?: string;
  label?: string;
  title?: string;
}

export interface SearchResultsResponse {
  items: Array<string | SearchSuggestionItem>;
}

export async function searchAll(query: string, limit = 5): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return request<SearchResultsResponse>(`/api/search?${params.toString()}`);
}

export async function searchUsers(query: string, limit = 10): Promise<FollowUser[]> {
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  // `/api/search` now returns only generic search suggestions for events/categories/tags.
  // User discovery needs a dedicated backend endpoint.
  void limit;
  return [];
}
