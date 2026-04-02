import { request } from './client.js';

/**
 * Загружает профиль текущего авторизованного пользователя.
 *
 * @returns {Promise<any>}
 */
export async function getMe() {
  return request('/me');
}
