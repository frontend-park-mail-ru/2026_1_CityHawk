import { request } from './client.js';
import type { HomeResponse } from '../types/api.js';

export async function getHome(): Promise<HomeResponse> {
  return request<HomeResponse>('/api/home');
}
