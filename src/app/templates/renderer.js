const partialNames = [
  'footer',
  'header',
  'hero-search',
  'login-aside',
  'login-form',
  'mood',
  'places',
  'register-form-step1',
  'register-form-step2',
  'register-form-step3',
  'reset_password-step1',
  'reset_password-step2'
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pageNames = [
  'app-error',
  'home',
  'login',
  'not-found',
  'register',
  'password_reset'
];

const templateCache = new Map();
let isLoaded = false;

const partialPaths = {
  footer: '/src/components/footer/footer.hbs',
  header: '/src/components/header/header.hbs',
  'hero-search': '/src/modules/home/hero-search.hbs',
  'login-aside': '/src/modules/auth/shared/login-aside.hbs',
  'login-form': '/src/modules/auth/login/login-form.hbs',
  mood: '/src/modules/collections/mood-section.hbs',
  places: '/src/modules/events/list/events-list.hbs',
  'register-form-step1': '/src/modules/auth/register/register-step1.hbs',
  'register-form-step2': '/src/modules/auth/register/register-step2.hbs',
  'register-form-step3': '/src/modules/auth/register/register-step3.hbs',
  'reset_password-step1': '/src/modules/auth/password_reset/reset_password-step1.hbs',
  'reset_password-step2': '/src/modules/auth/password_reset/reset_password-step2.hbs',
};

const pagePaths = {
  'app-error': '/src/app/app-error.hbs',
  home: '/src/pages/home/home.hbs',
  login: '/src/pages/login/login.hbs',
  'not-found': '/src/pages/not-found/not-found.hbs',
  register: '/src/pages/register/register.hbs',
  'password_reset': '/src/pages/password_reset/password_reset.hbs',
};

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
    partialNames.map(async (name) => [name, await loadText(partialPaths[name])]),
  );

  partials.forEach(([name, source]) => {
    Handlebars.registerPartial(name, source);
    templateCache.set(name, Handlebars.compile(source)); // <— добавляем в кэш
  });

  const pages = await Promise.all(
    pageNames.map(async (name) => [name, await loadText(pagePaths[name])]),
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
