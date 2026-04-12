import { renderTemplate } from '../../app/templates/renderer.js';
import { renderEventCard } from '../../components/event-card/event-card.js';

export interface HomeEventCard {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  tags?: string[];
  dateText?: string;
  placeText?: string;
}

export interface HomeEventsSectionState {
  events?: HomeEventCard[];
}

export function renderHomeEventsSection(state: HomeEventsSectionState = {}): string {
  const events = Array.isArray(state.events) ? state.events : [];

  return renderTemplate('home-events-section', {
    cardsHtml: events.map((event) => renderEventCard({
      ...event,
      textLines: [event.dateText || '', event.placeText || ''],
      cardClass: 'event-card--home',
    })),
  });
}
