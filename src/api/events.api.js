import { request } from './client.js';

/**
 * Сессия мероприятия для создания или обновления.
 *
 * @typedef {object} EventSessionPayload
 * @property {string} placeId
 * @property {string} startAt
 * @property {string} endAt
 * @property {number} price
 */

/**
 * Данные мероприятия для создания или обновления.
 *
 * @typedef {object} EventPayload
 * @property {string} title
 * @property {string} shortDescription
 * @property {string} fullDescription
 * @property {number} ageLimit
 * @property {string} sourceUrl
 * @property {string[]} categoryIds
 * @property {string[]} tagIds
 * @property {string[]} imageUrls
 * @property {EventSessionPayload[]} sessions
 */

/**
 * Загружает список мест.
 *
 * @returns {Promise<any>}
 */
export async function getPlaces() {
  return request('/places');
}

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

  const suffix = query.toString();
  return request(`/events${suffix ? '?' + suffix: ''}`);
}

/**
 * Загружает одно мероприятие по идентификатору.
 *
 * @param {string | number} eventId
 * @returns {Promise<any>}
 */
export async function getEventById(eventId) {
  return request(`/events/${eventId}`);
}

/**
 * Создаёт мероприятие.
 *
 * @param {EventPayload} payload
 * @returns {Promise<any>}
 */
export async function createEvent(payload) {
  return request('/events', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Обновляет мероприятие.
 *
 * @param {string | number} eventId
 * @param {Partial<EventPayload>} payload
 * @returns {Promise<any>}
 */
export async function updateEvent(eventId, payload) {
  return request(`/events/${eventId}`, {
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
  return request(`/events/${eventId}`, {
    method: 'DELETE',
  });
}
