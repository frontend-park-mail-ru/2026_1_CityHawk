import { request } from './client.js';
import type { FollowListResponse, FollowUser } from '../types/api.js';

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

export async function searchUsers(query: string, limit = 20, offset = 0): Promise<FollowUser[]> {
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const normalizedLimit = Math.max(1, Math.min(20, Math.trunc(limit) || 20));
  const normalizedOffset = Math.max(0, Math.trunc(offset) || 0);
  const params = new URLSearchParams({
    query: normalizedQuery,
    limit: String(normalizedLimit),
    offset: String(normalizedOffset),
  });
  const response = await request<FollowListResponse>(`/api/users/search?${params.toString()}`);
  return Array.isArray(response?.items) ? response.items : [];
}
