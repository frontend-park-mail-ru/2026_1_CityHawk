import { renderTemplate } from '../../app/templates/renderer.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */

/**
 * Рендерит страницу 404 для неизвестного маршрута.
 *
 * @param {RouteContext} options Параметры маршрута.
 * @returns {string}
 */
export function notFoundPage({ path }) {
  return renderTemplate('not-found', { path });
}
