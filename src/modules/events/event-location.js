import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит секцию с локацией мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventLocation(state = {}) {
  return renderTemplate('event-location', state);
}
