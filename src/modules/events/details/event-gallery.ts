import { renderTemplate } from '../../../app/templates/renderer.js';

export interface EventGalleryImage {
  imageUrl: string;
  alt: string;
}

export interface EventGalleryState {
  images?: EventGalleryImage[];
}

export function renderEventGallery(state: EventGalleryState = {}): string {
  const images = Array.isArray(state.images)
    ? state.images
      .map((image) => ({
        imageUrl: String(image?.imageUrl || '').trim(),
        alt: String(image?.alt || '').trim(),
      }))
      .filter((image) => Boolean(image.imageUrl))
      .slice(0, 4)
    : [];

  if (images.length <= 1) {
    return '';
  }

  const galleryClass = images.length === 2
    ? 'event-gallery--two'
    : images.length === 3
      ? 'event-gallery--three'
      : 'event-gallery--four';

  return renderTemplate('event-gallery', {
    images,
    galleryClass,
  });
}
