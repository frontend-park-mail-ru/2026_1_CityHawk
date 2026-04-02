import { request } from './client.js';

/**
 * Загружает данные для главной страницы.
 *
 * @returns {Promise<any>}
 */
export async function getHome() {
  return request('/api/home');
}
