import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventDeleteCardState {
  eventId?: string;
  eventTitle?: string;
}

export function renderEventDeleteCard(state: EventDeleteCardState = {}): string {
  return renderTemplate('event-delete-card', state);
}
