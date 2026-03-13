const partialNames = [
  'footer',
  'header',
  'hero',
  'login-aside',
  'login-form',
  'mood',
  'places',
  'register-form-step1',
  'register-form-step2',
  'register-form-step3',
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pageNames = [
  'app-error',
  'home',
  'login',
  'not-found',
  'register',
];

const templateCache = new Map();
let isLoaded = false;

/**
 * Возвращает глобальный runtime Handlebars или выбрасывает ошибку, если он не подключён.
 *
 * @returns {typeof Handlebars}
 */
function getHandlebars() {
  if (!window.Handlebars) {
    throw new Error('Handlebars runtime is not loaded');
  }

  return window.Handlebars;
}

/**
 * Загружает исходный текст шаблона по указанному пути.
 *
 * @param {string} path Путь к шаблону.
 * @returns {Promise<string>}
 */
async function loadText(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load template: ${path}`);
  }

  return response.text();
}

/**
 * Один раз за сессию загружает и компилирует все страницы и partial-шаблоны.
 *
 * @returns {Promise<void>}
 */
export async function loadTemplates() {
  if (isLoaded) {
    return;
  }

  const Handlebars = getHandlebars();

  const partials = await Promise.all(
    partialNames.map(async (name) => [name, await loadText(`/src/templates/partials/${name}.hbs`)]),
  );

  partials.forEach(([name, source]) => {
    Handlebars.registerPartial(name, source);
    templateCache.set(name, Handlebars.compile(source)); // <— добавляем в кэш
  });

  const pages = await Promise.all(
    pageNames.map(async (name) => [name, await loadText(`/src/templates/pages/${name}.hbs`)]),
  );

  pages.forEach(([name, source]) => {
    templateCache.set(name, Handlebars.compile(source));
  });

  isLoaded = true;
}

/**
 * Рендерит скомпилированный шаблон Handlebars по имени.
 *
 * @param {string} name Имя шаблона.
 * @param {Record<string, any>} [context] Контекст для рендера.
 * @returns {string}
 */
export function renderTemplate(name, context = {}) {
  const template = templateCache.get(name);

  if (!template) {
    throw new Error(`Template "${name}" is not loaded`);
  }

  return template(context);
}
