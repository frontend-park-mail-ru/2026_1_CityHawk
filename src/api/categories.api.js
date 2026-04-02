import { request } from './client.js';

/**
 * Загружает список категорий.
 *
 * @returns {Promise<any>}
 */
export async function getCategories() {
  return request('/api/categories');
}

/**
 * Загружает мероприятия конкретной категории через общий список событий.
 *
 * @param {string} categoryId
 * @returns {Promise<any>}
 */
export async function getCategoryEvents(categoryId) {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set('categoryId', String(categoryId));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/events${suffix}`);
}
