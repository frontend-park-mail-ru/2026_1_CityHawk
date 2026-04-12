import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventLocationState {
  paragraphs?: string[];
  mapImageUrl?: string;
  mapAlt?: string;
}

export function renderEventLocation(state: EventLocationState = {}): string {
  return renderTemplate('event-location', state);
}
