import { request } from './client.js';
import type { HomeResponse } from '../types/api.js';

export interface HomeQueryParams {
  city?: string;
}

export async function getHome(params: HomeQueryParams = {}): Promise<HomeResponse> {
  const query = new URLSearchParams();
  const city = String(params.city || '').trim();

  if (city) {
    query.set('city', city);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<HomeResponse>(`/api/home${suffix}`);
}
