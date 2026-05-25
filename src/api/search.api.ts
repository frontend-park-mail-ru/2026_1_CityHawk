import { request } from './client.js';
import type { FollowUser } from '../types/api.js';

export interface SearchSuggestionItem {
  id?: string;
  type?: string;
  label?: string;
  title?: string;
  name?: string;
  email?: string;
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

  const normalizedLimit = Math.max(5, Math.min(10, Math.trunc(limit) || 10));
  const response = await searchAll(normalizedQuery, normalizedLimit);
  const items = Array.isArray(response?.items) ? response.items : [];

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const source = item as Record<string, unknown>;
      const type = String(source.type || '').trim().toLowerCase();
      if (type !== 'user') {
        return null;
      }

      const id = String(source.id || '').trim();
      if (!id) {
        return null;
      }

      const label = String(source.label || '').trim();
      const explicitEmail = String(source.email || '').trim();
      const email = explicitEmail || (label.includes('@') && !label.startsWith('@') ? label : '');
      const title = String(source.title || source.name || email || label || '').trim();
      const [first = '', second = ''] = title.split(/\s+/, 2);

      return {
        id,
        username: first || title || 'Пользователь',
        userSurname: second || '',
        email: email || undefined,
        avatarUrl: String(source.avatarUrl || '').trim() || null,
        city: source.city && typeof source.city === 'object'
          ? (source.city as FollowUser['city'])
          : null,
        isFollowing: Boolean(source.isFollowing),
      } satisfies FollowUser;
    })
    .filter((item): item is FollowUser => Boolean(item));
}
