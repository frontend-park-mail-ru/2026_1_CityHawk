import { request } from './client.js';
import type { TagListResponse } from '../types/api.js';

export async function getTags(): Promise<TagListResponse> {
  return request<TagListResponse>('/api/tags');
}
