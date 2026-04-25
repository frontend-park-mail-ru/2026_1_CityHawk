import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventsMapMoodCard {
  title: string;
  imageUrl: string;
  href: string;
}

export interface EventsMapMoodSidebarState {
  heading: string;
  cards: EventsMapMoodCard[];
}

export function renderEventsMapMoodSidebar(state: EventsMapMoodSidebarState): string {
  return renderTemplate('events-mood-sidebar', {
    heading: state.heading,
    cards: Array.isArray(state.cards) ? state.cards : [],
  });
}
