type TemplateName = string;
type TemplateContext = Record<string, unknown>;
type CompiledTemplate = (context?: TemplateContext) => string;

interface HandlebarsRuntime {
  compile(source: string): CompiledTemplate;
  registerPartial(name: string, source: string): void;
}

declare global {
  interface Window {
    Handlebars?: HandlebarsRuntime;
  }
}

const partialNames = [
  'event-card',
  'form-input',
  'form-select',
  'event-description',
  'event-delete-card',
  'event-delete-screen',
  'event-edit-intro',
  'event-editor-screen',
  'event-form',
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
  'profile-aside',
  'profile-form',
  'register-form-step1',
  'register-form-step2',
  'register-form-step3',
  'reset_password-step1',
  'reset_password-step2',
] as const;

const pageNames = [
  'app-error',
  'event',
  'event-list',
  'home',
  'login',
  'not-found',
  'profile',
  'register',
  'password_reset',
] as const;

const templateCache = new Map<TemplateName, CompiledTemplate>();
let isLoaded = false;

const partialPaths: Record<(typeof partialNames)[number], string> = {
  'event-card': '/src/components/event-card/event-card.hbs',
  'form-input': '/src/components/form-controls/form-input.hbs',
  'form-select': '/src/components/form-controls/form-select.hbs',
  footer: '/src/components/footer/footer.hbs',
  'event-description': '/src/modules/events/event-description.hbs',
  'event-delete-card': '/src/modules/events/event-delete-card.hbs',
  'event-delete-screen': '/src/modules/events/event-delete-screen.hbs',
  'event-edit-intro': '/src/modules/events/event-edit-intro.hbs',
  'event-editor-screen': '/src/modules/events/event-editor-screen.hbs',
  'event-form': '/src/modules/events/event-form.hbs',
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
  'profile-aside': '/src/modules/profile/profile-aside.hbs',
  'profile-form': '/src/modules/profile/profile-form.hbs',
  'register-form-step1': '/src/modules/auth/register/register-step1.hbs',
  'register-form-step2': '/src/modules/auth/register/register-step2.hbs',
  'register-form-step3': '/src/modules/auth/register/register-step3.hbs',
  'reset_password-step1': '/src/modules/auth/password_reset/reset_password-step1.hbs',
  'reset_password-step2': '/src/modules/auth/password_reset/reset_password-step2.hbs',
};

const pagePaths: Record<(typeof pageNames)[number], string> = {
  'app-error': '/src/app/app-error.hbs',
  event: '/src/pages/event/event.hbs',
  'event-list': '/src/pages/event-list/event-list.hbs',
  home: '/src/pages/home/home.hbs',
  login: '/src/pages/login/login.hbs',
  'not-found': '/src/pages/not-found/not-found.hbs',
  profile: '/src/pages/profile/profile.hbs',
  register: '/src/pages/register/register.hbs',
  'password_reset': '/src/pages/password_reset/password_reset.hbs',
};

function getHandlebars(): HandlebarsRuntime {
  if (!window.Handlebars) {
    throw new Error('Handlebars runtime is not loaded');
  }

  return window.Handlebars;
}

async function loadText(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load template: ${path}`);
  }

  return response.text();
}

export async function loadTemplates(): Promise<void> {
  if (isLoaded) {
    return;
  }

  const Handlebars = getHandlebars();

  const partials = await Promise.all(
    partialNames.map(async (name) => [name, await loadText(partialPaths[name])] as const),
  );

  partials.forEach(([name, source]) => {
    Handlebars.registerPartial(name, source);
    templateCache.set(name, Handlebars.compile(source));
  });

  const pages = await Promise.all(
    pageNames.map(async (name) => [name, await loadText(pagePaths[name])] as const),
  );

  pages.forEach(([name, source]) => {
    templateCache.set(name, Handlebars.compile(source));
  });

  isLoaded = true;
}

export function renderTemplate(name: string, context: TemplateContext = {}): string {
  const template = templateCache.get(name);

  if (!template) {
    throw new Error(`Template "${name}" is not loaded`);
  }

  return template(context);
}
