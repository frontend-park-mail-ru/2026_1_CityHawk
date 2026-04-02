import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит галерею мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventGallery(state = {}) {
  return renderTemplate('event-gallery', state);
}
