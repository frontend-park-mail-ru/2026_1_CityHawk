import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит секцию рекомендаций на странице мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventRecommendations(state = {}) {
  return renderTemplate('event-recommendations', state);
}
