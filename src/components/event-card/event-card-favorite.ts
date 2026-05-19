import { addEventToFavorites, removeEventFromFavorites } from '../../api/favorites.api.js';
import { showToast } from '../../app/ui/toast.js';
import type { ApiError } from '../../types/api.js';

function setFavoriteUiState(
  root: HTMLElement,
  eventId: string,
  isActive: boolean,
  isLoading: boolean,
): void {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-role="event-card-favorite"]'),
  ).filter((button) => String(button.dataset.eventId || '').trim() === eventId);

  buttons.forEach((button) => {
    button.classList.toggle('event-card__favorite--active', isActive);
    button.classList.toggle('event-card__favorite--loading', isLoading);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.setAttribute('aria-label', isActive ? 'Убрать из избранного' : 'Добавить в избранное');
  });
}

export function attachEventCardFavorites(root: HTMLElement): () => void {
  const pendingByEventId = new Set<string>();

  const handleClick = async (event: Event): Promise<void> => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>('[data-role="event-card-favorite"]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const eventId = String(button.dataset.eventId || '').trim();
    if (!eventId || pendingByEventId.has(eventId)) {  
      return;
    }

    const isCurrentlyActive = button.classList.contains('event-card__favorite--active');
    pendingByEventId.add(eventId);
    setFavoriteUiState(root, eventId, isCurrentlyActive, true);

    try {
      if (isCurrentlyActive) {
        await removeEventFromFavorites(eventId);
        setFavoriteUiState(root, eventId, false, false);
        showToast('Событие удалено из избранного', { type: 'success' });
      } else {
        await addEventToFavorites(eventId);
        setFavoriteUiState(root, eventId, true, false);
        showToast('Событие добавлено в избранное', { type: 'success' });
      }
    } catch (error) {
      const apiError = error as ApiError;

      if (apiError?.status === 409) {
        setFavoriteUiState(root, eventId, true, false);
        return;
      }

      setFavoriteUiState(root, eventId, isCurrentlyActive, false);

      if (apiError?.status === 401 || apiError?.status === 403) {
        showToast('Войдите в аккаунт, чтобы работать с избранным', { type: 'error' });
        return;
      }

      const message = error instanceof Error ? error.message : 'Не удалось обновить избранное';
      showToast(message, { type: 'error' });
    } finally {
      pendingByEventId.delete(eventId);
    }
  };

  root.addEventListener('click', handleClick);

  return () => {
    root.removeEventListener('click', handleClick);
  };
}
