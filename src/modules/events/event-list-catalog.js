import { renderTemplate } from '../../app/templates/renderer.js';

export function renderEventListCatalog(state = {}) {
  const cards = Array.isArray(state.cards) ? state.cards : [];

  return renderTemplate('event-list-catalog', {
    cards,
    hasCards: typeof state.hasCards === 'boolean' ? state.hasCards : cards.length > 0,
  });
}
