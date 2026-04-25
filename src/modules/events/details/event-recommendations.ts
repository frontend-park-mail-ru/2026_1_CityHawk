import { renderTemplate } from '../../../app/templates/renderer.js';
import { renderEventCard } from '../../../components/event-card/event-card.js';

export interface RecommendationItem {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface EventRecommendationsState {
  items?: RecommendationItem[];
}

export function renderEventRecommendations(state: EventRecommendationsState = {}): string {
  const items = Array.isArray(state.items) ? state.items : [];

  return renderTemplate('event-recommendations', {
    ...state,
    cardsHtml: items.map((item) => renderEventCard({
      ...item,
      textLines: [item.description || ''],
      cardClass: 'event-card--recommendation',
    })),
  });
}
