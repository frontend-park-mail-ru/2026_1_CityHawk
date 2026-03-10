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
