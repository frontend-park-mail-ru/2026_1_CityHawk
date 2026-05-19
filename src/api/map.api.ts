import { request } from './client.js';
import type {
  MapCollectionsResponse,
  MapCollectionSpotsResponse,
  MapFiltersResponse,
} from '../types/api.js';

export interface MapCollectionsQueryParams {
  cityId?: string;
  limit?: number;
}

export interface MapCollectionSpotsQueryParams {
  cityId?: string;
  query?: string;
  tagId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(params: Record<string, string | number | undefined> = {}): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : '';
}

export function getMapCollections(
  params: MapCollectionsQueryParams = {},
): Promise<MapCollectionsResponse> {
  return request<MapCollectionsResponse>(`/api/map/collections${buildQuery(params)}`);
}

export function getMapFilters(
  cityId?: string,
): Promise<MapFiltersResponse> {
  return request<MapFiltersResponse>(`/api/map/filters${buildQuery({ cityId })}`);
}

export function getMapCollectionSpots(
  collectionId: string,
  params: MapCollectionSpotsQueryParams = {},
): Promise<MapCollectionSpotsResponse> {
  return request<MapCollectionSpotsResponse>(
    `/api/map/collections/${encodeURIComponent(collectionId)}/spots${buildQuery(params)}`,
  );
}
