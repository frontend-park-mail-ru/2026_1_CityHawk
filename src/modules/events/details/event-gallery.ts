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

export function attachEventGallery(root: ParentNode): () => void {
  const gallery = root.querySelector<HTMLElement>('[data-role="event-gallery"]');
  const imageButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-role="event-gallery-open"]'),
  );
  const modal = root.querySelector<HTMLElement>('[data-role="event-gallery-modal"]');
  const modalImage = root.querySelector<HTMLImageElement>('[data-role="event-gallery-modal-image"]');
  const modalCounter = root.querySelector<HTMLElement>('[data-role="event-gallery-modal-counter"]');
  const closeButtons = Array.from(
    root.querySelectorAll<HTMLElement>('[data-role="event-gallery-close"]'),
  );
  const prevButton = root.querySelector<HTMLButtonElement>('[data-role="event-gallery-prev"]');
  const nextButton = root.querySelector<HTMLButtonElement>('[data-role="event-gallery-next"]');

  if (
    !(gallery instanceof HTMLElement)
    || !(modal instanceof HTMLElement)
    || !(modalImage instanceof HTMLImageElement)
    || imageButtons.length === 0
  ) {
    return () => {};
  }

  const items = imageButtons
    .map((button, index) => ({
      index,
      imageUrl: String(button.dataset.imageUrl || '').trim(),
      alt: String(button.dataset.alt || '').trim() || `Фото ${index + 1}`,
    }))
    .filter((item) => Boolean(item.imageUrl));

  if (items.length === 0) {
    return () => {};
  }

  let activeIndex = 0;

  const renderActiveImage = () => {
    const item = items[activeIndex];
    if (!item) {
      return;
    }

    modalImage.src = item.imageUrl;
    modalImage.alt = item.alt;
    if (modalCounter instanceof HTMLElement) {
      modalCounter.textContent = `${activeIndex + 1} / ${items.length}`;
    }
  };

  const openModal = (index: number) => {
    activeIndex = index >= 0 && index < items.length ? index : 0;
    renderActiveImage();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  const showPrevious = () => {
    activeIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    renderActiveImage();
  };

  const showNext = () => {
    activeIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    renderActiveImage();
  };

  const handleImageButtonClick = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const index = Number(target.dataset.index || 0);
    openModal(Number.isFinite(index) ? index : 0);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (modal.hidden) {
      return;
    }

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key === 'ArrowLeft') {
      showPrevious();
      return;
    }

    if (event.key === 'ArrowRight') {
      showNext();
    }
  };

  imageButtons.forEach((button) => button.addEventListener('click', handleImageButtonClick));
  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  prevButton?.addEventListener('click', showPrevious);
  nextButton?.addEventListener('click', showNext);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    imageButtons.forEach((button) => button.removeEventListener('click', handleImageButtonClick));
    closeButtons.forEach((button) => button.removeEventListener('click', closeModal));
    prevButton?.removeEventListener('click', showPrevious);
    nextButton?.removeEventListener('click', showNext);
    window.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';
  };
}
