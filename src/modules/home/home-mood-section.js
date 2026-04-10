import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит секцию подборок для главной страницы.
 *
 * @param {{
 *   moodLeft?: Array<Record<string, any>>,
 *   moodTall?: Record<string, any>
 * }} [state]
 * @returns {string}
 */
export function renderHomeMoodSection(state = {}) {
  return renderTemplate('mood', {
    moodLeft: Array.isArray(state.moodLeft) ? state.moodLeft : [],
    moodTall: state.moodTall ?? {},
  });
}
