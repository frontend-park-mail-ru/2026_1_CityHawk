import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит секцию мероприятий для главной страницы.
 *
 * @param {{ events?: Array<Record<string, any>> }} [state]
 * @returns {string}
 */
export function renderHomeEventsSection(state = {}) {
  return renderTemplate('home-events-section', {
    events: Array.isArray(state.events) ? state.events : [],
  });
}
