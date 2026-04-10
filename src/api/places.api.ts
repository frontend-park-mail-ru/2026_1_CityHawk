import { request } from './client.js';
import type { PlaceListResponse } from '../types/api.js';

export async function getPlaces(): Promise<PlaceListResponse> {
  return request<PlaceListResponse>('/api/places');
}
