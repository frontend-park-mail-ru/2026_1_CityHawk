import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventLocationState {
  paragraphs?: string[];
  mapImageUrl?: string;
  mapAlt?: string;
}

export function renderEventLocation(state: EventLocationState = {}): string {
  return renderTemplate('event-location', state);
}

export function attachEventLocation(root: ParentNode): () => void {
  const mapButton = root.querySelector('[data-role="event-location-map"]');

  const handleMapClick = (): void => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (mapButton instanceof HTMLButtonElement) {
    mapButton.addEventListener('click', handleMapClick);
  }

  return () => {
    if (mapButton instanceof HTMLButtonElement) {
      mapButton.removeEventListener('click', handleMapClick);
    }
  };
}
