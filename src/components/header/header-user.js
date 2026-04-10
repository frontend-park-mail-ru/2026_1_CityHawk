/**
 * Возвращает имя пользователя для шапки.
 *
 * @param {{
 *   name?: string,
 *   username?: string,
 *   userSurname?: string,
 *   email?: string
 * } | null | undefined} user
 * @returns {string}
 */
export function getHeaderUserDisplayName(user) {
  if (user?.name) {
    return String(user.name).trim();
  }

  if (user?.username && user?.userSurname) {
    return `${String(user.username).trim()} ${String(user.userSurname).trim()}`.trim();
  }

  if (user?.username) {
    return String(user.username).trim();
  }

  if (user?.email) {
    return String(user.email).split('@')[0];
  }

  return '';
}
