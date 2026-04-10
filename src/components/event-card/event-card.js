import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит общую карточку события.
 *
 * @param {{
 *   id?: string | number,
 *   imageUrl?: string,
 *   title?: string,
 *   textLines?: string[],
 *   tags?: string[],
 *   cardClass?: string
 * }} [state]
 * @returns {string}
 */
export function renderEventCard(state = {}) {
  return renderTemplate('event-card', {
    id: state.id ?? '',
    imageUrl: state.imageUrl || '',
    title: state.title || '',
    textLines: Array.isArray(state.textLines) ? state.textLines.filter(Boolean) : [],
    tags: Array.isArray(state.tags) ? state.tags : [],
    cardClass: state.cardClass || '',
  });
}
