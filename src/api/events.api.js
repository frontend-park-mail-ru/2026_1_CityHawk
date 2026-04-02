import { request } from './client.js';

/**
 * Загружает список мероприятий.
 *
 * @param {Record<string, string | number | boolean | undefined>} [params]
 * @returns {Promise<any>}
 */
export async function getEvents(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/events${suffix}`);
}

/**
 * Загружает одно мероприятие по идентификатору.
 *
 * @param {string | number} eventId
 * @returns {Promise<any>}
 */
export async function getEventById(eventId) {
  return request(`/api/events/${eventId}`);
}

/**
 * Создаёт мероприятие.
 *
 * @param {Record<string, unknown>} payload
 * @returns {Promise<any>}
 */
export async function createEvent(payload) {
  return request('/api/events', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Обновляет мероприятие.
 *
 * @param {string | number} eventId
 * @param {Record<string, unknown>} payload
 * @returns {Promise<any>}
 */
export async function updateEvent(eventId, payload) {
  return request(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Удаляет мероприятие.
 *
 * @param {string | number} eventId
 * @returns {Promise<any>}
 */
export async function deleteEvent(eventId) {
  return request(`/api/events/${eventId}`, {
    method: 'DELETE',
  });
}
