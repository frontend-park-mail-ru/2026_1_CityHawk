import { renderTemplate } from '../../../app/templates/renderer.js';
import { renderEventCard } from '../../../components/event-card/event-card.js';

export interface EventListCatalogCard {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  tags?: string[];
  dateText?: string;
  placeText?: string;
}

export interface EventListCatalogState {
  cards?: EventListCatalogCard[];
  hasCards?: boolean;
  canCreateEvent?: boolean;
}

export function renderEventListCatalog(state: EventListCatalogState = {}): string {
  const cards = Array.isArray(state.cards) ? state.cards : [];

  return renderTemplate('event-list-catalog', {
    cardsHtml: cards.map((card) => renderEventCard({
      ...card,
      textLines: [card.dateText || '', card.placeText || ''],
      cardClass: 'event-card--catalog',
    })),
    hasCards: typeof state.hasCards === 'boolean' ? state.hasCards : cards.length > 0,
    canCreateEvent: Boolean(state.canCreateEvent),
  });
}
