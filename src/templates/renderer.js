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

const pageNames = [
  'home',
  'login',
  'register',
];

const templateCache = new Map();
let isLoaded = false;

function getHandlebars() {
  if (!window.Handlebars) {
    throw new Error('Handlebars runtime is not loaded');
  }

  return window.Handlebars;
}

async function loadText(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load template: ${path}`);
  }

  return response.text();
}

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

export function renderTemplate(name, context = {}) {
  const template = templateCache.get(name);

  if (!template) {
    throw new Error(`Template "${name}" is not loaded`);
  }

  return template(context);
}
