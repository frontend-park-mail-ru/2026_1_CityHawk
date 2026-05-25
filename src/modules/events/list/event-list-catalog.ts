import { renderTemplate } from '../../../app/templates/renderer.js';
import { renderEventCard } from '../../../components/event-card/event-card.js';

export interface EventListCatalogCard {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  tags?: string[];
  dateText?: string;
  placeText?: string;
  isFavorite?: boolean;
}

export interface EventListCatalogState {
  cards?: EventListCatalogCard[];
  hasCards?: boolean;
  canCreateEvent?: boolean;
  currentPage?: number;
  totalPages?: number;
  prevHref?: string;
  nextHref?: string;
  pages?: Array<{
    href?: string;
    label: string;
    active?: boolean;
    isGap?: boolean;
  }>;
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
    hasPagination: Number(state.totalPages || 0) > 1,
    currentPage: Number(state.currentPage || 1),
    totalPages: Number(state.totalPages || 1),
    prevHref: state.prevHref || '',
    nextHref: state.nextHref || '',
    pages: Array.isArray(state.pages) ? state.pages : [],
  });
}
