import { request } from './client.js';

export interface PlaceSuggestionItem {
  token: string;
  label: string;
  name: string;
  addressLine: string;
  cityName: string;
  countryName: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestionsResponse {
  items: PlaceSuggestionItem[];
}

export interface ResolvePlaceResponse {
  id: string;
  cityId: string;
  name: string;
  addressLine: string;
  cityName: string;
  countryName: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export async function getPlaceSuggestions(query: string, limit = 5): Promise<PlaceSuggestionsResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
  });

  return request<PlaceSuggestionsResponse>(`/api/place-suggestions?${params.toString()}`);
}

export async function resolvePlaceSuggestion(token: string): Promise<ResolvePlaceResponse> {
  return request<ResolvePlaceResponse>('/api/places/resolve', {
    method: 'POST',
    body: { token },
  });
}
