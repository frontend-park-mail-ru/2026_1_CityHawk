const partialNames = [
  'event-description',
  'event-create-form',
  'event-list-catalog',
  'event-list-filters',
  'event-gallery',
  'event-hero',
  'event-location',
  'event-recommendations',
  'footer',
  'header',
  'home-events-section',
  'hero-search',
  'login-aside',
  'login-form',
  'mood',
  'register-form-step1',
  'register-form-step2',
  'register-form-step3',
  'reset_password-step1',
  'reset_password-step2'
];

const pageNames = [
  'app-error',
  'event',
  'event-create',
  'event-list',
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
  'event-description': '/src/modules/events/event-description.hbs',
  'event-create-form': '/src/modules/events/event-create-form.hbs',
  'event-list-catalog': '/src/modules/events/event-list-catalog.hbs',
  'event-list-filters': '/src/modules/events/event-list-filters.hbs',
  'event-gallery': '/src/modules/events/event-gallery.hbs',
  'event-hero': '/src/modules/events/event-hero.hbs',
  'event-location': '/src/modules/events/event-location.hbs',
  'event-recommendations': '/src/modules/events/event-recommendations.hbs',
  header: '/src/components/header/header.hbs',
  'home-events-section': '/src/modules/home/home-events-section.hbs',
  'hero-search': '/src/modules/home/hero-search.hbs',
  'login-aside': '/src/modules/auth/shared/login-aside.hbs',
  'login-form': '/src/modules/auth/login/login-form.hbs',
  mood: '/src/modules/home/home-mood-section.hbs',
  'register-form-step1': '/src/modules/auth/register/register-step1.hbs',
  'register-form-step2': '/src/modules/auth/register/register-step2.hbs',
  'register-form-step3': '/src/modules/auth/register/register-step3.hbs',
  'reset_password-step1': '/src/modules/auth/password_reset/reset_password-step1.hbs',
  'reset_password-step2': '/src/modules/auth/password_reset/reset_password-step2.hbs',
};

const pagePaths = {
  'app-error': '/src/app/app-error.hbs',
  event: '/src/pages/event/event.hbs',
  'event-create': '/src/pages/event-create/event-create.hbs',
  'event-list': '/src/pages/event-list/event-list.hbs',
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
