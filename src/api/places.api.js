import { request } from './client.js';

/**
 * Загружает список доступных мест проведения.
 *
 * @returns {Promise<any>}
 */
export async function getPlaces() {
  return request('/api/places');
}
