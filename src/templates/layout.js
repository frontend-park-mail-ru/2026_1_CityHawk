/**
 * Собирает простой карточный layout для статических fallback-страниц.
 *
 * @param {{ title: string, description: string, content?: string }} options Параметры layout.
 * @returns {string}
 */
export function pageLayout({ title, description, content = '' }) {
  return `
    <section class="card">
      <h1>${title}</h1>
      <p>${description}</p>
      <nav class="nav">
        <a href="/">Главная</a>
        <a href="/login">Логин</a>
        <a href="/register">Регистрация</a>
      </nav>
      ${content}
    </section>
  `;
}
