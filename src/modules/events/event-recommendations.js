import { renderTemplate } from '../../app/templates/renderer.js';
import { renderEventCard } from '../../components/event-card/event-card.js';

/**
 * Рендерит секцию рекомендаций на странице мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventRecommendations(state = {}) {
  const items = Array.isArray(state.items) ? state.items : [];

  return renderTemplate('event-recommendations', {
    ...state,
    cardsHtml: items.map((item) => renderEventCard({
      ...item,
      textLines: [item.description],
      cardClass: 'event-card--recommendation',
    })),
  });
}
