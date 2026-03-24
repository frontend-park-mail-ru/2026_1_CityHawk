import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит страницу 404 для неизвестного маршрута.
 *
 * @param {{ path: string }} options Параметры маршрута.
 * @returns {string}
 */
export function notFoundPage({ path }) {
  return renderTemplate('not-found', { path });
}
