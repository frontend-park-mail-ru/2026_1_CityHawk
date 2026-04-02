import { request } from './client.js';

/**
 * Выполняет поиск по мероприятиям, категориям и тегам.
 *
 * @param {string} query
 * @returns {Promise<any>}
 */
export async function searchAll(query) {
  const params = new URLSearchParams({ q: query });
  return request(`/search?${params.toString()}`);
}
