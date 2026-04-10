import { renderTemplate } from '../../app/templates/renderer.js';
import { renderEventCard } from '../../components/event-card/event-card.js';

/**
 * Рендерит секцию мероприятий для главной страницы.
 *
 * @param {{ events?: Array<Record<string, any>> }} [state]
 * @returns {string}
 */
export function renderHomeEventsSection(state = {}) {
  const events = Array.isArray(state.events) ? state.events : [];

  return renderTemplate('home-events-section', {
    cardsHtml: events.map((event) => renderEventCard({
      ...event,
      textLines: [event.dateText, event.placeText],
      cardClass: 'event-card--home',
    })),
  });
}
