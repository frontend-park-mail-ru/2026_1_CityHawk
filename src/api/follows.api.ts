import { request } from './client.js';
import type { FollowListResponse } from '../types/api.js';

export async function getMyFollowers(limit = 100, offset = 0): Promise<FollowListResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return request<FollowListResponse>(`/api/me/followers?${query.toString()}`);
}

export async function getMyFollowing(limit = 100, offset = 0): Promise<FollowListResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return request<FollowListResponse>(`/api/me/following?${query.toString()}`);
}

export async function followUser(userId: string): Promise<{ ok: true } | null> {
  return request<{ ok: true } | null>(`/api/users/${encodeURIComponent(userId)}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(userId: string): Promise<{ ok: true } | null> {
  return request<{ ok: true } | null>(`/api/users/${encodeURIComponent(userId)}/follow`, {
    method: 'DELETE',
  });
}
