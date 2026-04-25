import { renderTemplate } from '../../../app/templates/renderer.js';

export interface EventHeroState {
  eventId?: string;
  category?: string;
  title?: string;
  dateText?: string;
  placeText?: string;
  posterUrl?: string;
  canManage?: boolean;
}

export function renderEventHero(state: EventHeroState = {}): string {
  return renderTemplate('event-hero', state);
}
