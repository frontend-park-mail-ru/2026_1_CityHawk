import { request } from './client.js';

/**
 * Выполняет поиск по мероприятиям, категориям и тегам.
 *
 * @param {string} query
 * @returns {Promise<any>}
 */
export async function searchAll(query) {
  const params = new URLSearchParams({ query });
  return request(`/api/search?${params.toString()}`);
}
