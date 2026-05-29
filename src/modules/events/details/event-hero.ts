import { renderTemplate } from '../../../app/templates/renderer.js';
import { addEventToFavorites, removeEventFromFavorites } from '../../../api/favorites.api.js';
import { getUserErrorMessage } from '../../../api/errors.js';
import { showToast } from '../../../app/ui/toast.js';
import type { ApiError } from '../../../types/api.js';

export interface EventHeroState {
  eventId?: string;
  category?: string;
  title?: string;
  dateText?: string;
  placeText?: string;
  posterUrl?: string;
  shareUrl?: string;
  isFavorite?: boolean;
}

export function renderEventHero(state: EventHeroState = {}): string {
  const isMovieEvent = String(state.category || '').trim().toLowerCase() === 'кино';

  return renderTemplate('event-hero', {
    ...state,
    posterClass: isMovieEvent ? 'event-hero__poster--movie' : '',
  });
}

function setEventHeroFavoriteState(button: HTMLButtonElement, isFavorite: boolean, isLoading: boolean): void {
  button.classList.toggle('event-hero__action--favorite-active', isFavorite);
  button.classList.toggle('event-hero__action--favorite-loading', isLoading);
  button.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
  button.setAttribute('aria-label', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
}

export function attachEventHeroFavorite(root: ParentNode): () => void {
  const button = root.querySelector<HTMLButtonElement>('[data-role="event-hero-favorite"]');

  if (!(button instanceof HTMLButtonElement)) {
    return () => {};
  }

  let pending = false;

  const handleClick = async (event: Event): Promise<void> => {
    event.preventDefault();

    if (pending) {
      return;
    }

    const eventId = String(button.dataset.eventId || '').trim();
    if (!eventId) {
      return;
    }

    const isCurrentlyFavorite = button.classList.contains('event-hero__action--favorite-active');
    pending = true;
    setEventHeroFavoriteState(button, isCurrentlyFavorite, true);

    try {
      if (isCurrentlyFavorite) {
        await removeEventFromFavorites(eventId);
        setEventHeroFavoriteState(button, false, false);
        showToast('Событие удалено из избранного', { type: 'success' });
      } else {
        await addEventToFavorites(eventId);
        setEventHeroFavoriteState(button, true, false);
        showToast('Событие добавлено в избранное', { type: 'success' });
      }
    } catch (error) {
      const apiError = error as ApiError;

      if (apiError?.status === 409) {
        setEventHeroFavoriteState(button, true, false);
        return;
      }

      setEventHeroFavoriteState(button, isCurrentlyFavorite, false);

      if (apiError?.status === 401 || apiError?.status === 403) {
        showToast('Войдите в аккаунт, чтобы работать с избранным', { type: 'error' });
        return;
      }

      showToast(getUserErrorMessage(error, 'Не удалось обновить избранное'), { type: 'error' });
    } finally {
      pending = false;
    }
  };

  button.addEventListener('click', handleClick);

  return () => {
    button.removeEventListener('click', handleClick);
  };
}
