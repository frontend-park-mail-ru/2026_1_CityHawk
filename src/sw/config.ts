export const SHELL_CACHE = 'cityhawk-shell-v1';
export const DATA_CACHE = 'cityhawk-data-v1';
export const STATIC_CACHE = 'cityhawk-static-v1';
export const HANDLEBARS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.8/handlebars.min.js';

const TEMPLATE_URLS = [
  '/src/components/event-card/event-card.hbs',
  '/src/components/form-controls/form-input.hbs',
  '/src/components/form-controls/form-select.hbs',
  '/src/components/footer/footer.hbs',
  '/src/components/header/header.hbs',
  '/src/modules/events/event-description.hbs',
  '/src/modules/events/event-delete-card.hbs',
  '/src/modules/events/event-delete-screen.hbs',
  '/src/modules/events/event-edit-intro.hbs',
  '/src/modules/events/event-editor-screen.hbs',
  '/src/modules/events/event-form.hbs',
  '/src/modules/events/event-gallery.hbs',
  '/src/modules/events/event-hero.hbs',
  '/src/modules/events/event-list-catalog.hbs',
  '/src/modules/events/event-list-filters.hbs',
  '/src/modules/events/event-location.hbs',
  '/src/modules/events/event-recommendations.hbs',
  '/src/modules/auth/shared/login-aside.hbs',
  '/src/modules/auth/login/login-form.hbs',
  '/src/modules/auth/register/register-step1.hbs',
  '/src/modules/auth/register/register-step2.hbs',
  '/src/modules/auth/register/register-step3.hbs',
  '/src/modules/auth/password_reset/reset_password-step1.hbs',
  '/src/modules/auth/password_reset/reset_password-step2.hbs',
  '/src/modules/home/hero-search.hbs',
  '/src/modules/home/home-events-section.hbs',
  '/src/modules/home/home-mood-section.hbs',
  '/src/modules/profile/profile-aside.hbs',
  '/src/modules/profile/profile-form.hbs',
  '/src/app/app-error.hbs',
  '/src/pages/event/event.hbs',
  '/src/pages/event-list/event-list.hbs',
  '/src/pages/home/home.hbs',
  '/src/pages/login/login.hbs',
  '/src/pages/not-found/not-found.hbs',
  '/src/pages/password_reset/password_reset.hbs',
  '/src/pages/profile/profile.hbs',
  '/src/pages/register/register.hbs',
];

export const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/runtime-config.js',
  '/public/static/favicons/site.webmanifest',
  ...TEMPLATE_URLS,
];
