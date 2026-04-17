import { request } from './client.js';
import type { CityListResponse } from '../types/api.js';

export async function getCities(): Promise<CityListResponse> {
  return request<CityListResponse>('/api/cities');
}
