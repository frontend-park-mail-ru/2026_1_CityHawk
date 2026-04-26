import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventCardRenderState {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  textLines?: string[];
  tags?: string[];
  cardClass?: string;
  isFavorite?: boolean;
}

export function renderEventCard(state: EventCardRenderState = {}): string {
  return renderTemplate('event-card', {
    id: state.id ?? '',
    imageUrl: state.imageUrl || '',
    title: state.title || '',
    textLines: Array.isArray(state.textLines) ? state.textLines.filter(Boolean) : [],
    tags: Array.isArray(state.tags) ? state.tags : [],
    cardClass: state.cardClass || '',
    isFavorite: Boolean(state.isFavorite),
  });
}
