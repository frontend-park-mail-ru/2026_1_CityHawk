let accessToken = null;

/**
 * Возвращает текущий access token из памяти приложения.
 *
 * @returns {string | null}
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Сохраняет access token в памяти приложения.
 *
 * @param {string | null | undefined} token Новый токен.
 * @returns {void}
 */
export function setAccessToken(token) {
  accessToken = token || null;
}

/**
 * Очищает access token из памяти приложения.
 *
 * @returns {void}
 */
export function clearAccessToken() {
  accessToken = null;
}
