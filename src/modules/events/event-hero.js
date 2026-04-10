import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит hero-секцию страницы мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventHero(state = {}) {
  return renderTemplate('event-hero', state);
}
