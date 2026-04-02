import { request } from './client.js';

/**
 * Загружает список категорий.
 *
 * @returns {Promise<any>}
 */
export async function getCategories() {
  return request('/categories');
}

/**
 * Загружает мероприятия конкретной категории.
 *
 * @param {string} categorySlug
 * @returns {Promise<any>}
 */
export async function getCategoryEvents(categorySlug) {
  return request(`/categories/${categorySlug}/events`);
}
