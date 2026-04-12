import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventGalleryImage {
  imageUrl: string;
  alt: string;
}

export interface EventGalleryState {
  images?: EventGalleryImage[];
}

export function renderEventGallery(state: EventGalleryState = {}): string {
  return renderTemplate('event-gallery', state);
}
