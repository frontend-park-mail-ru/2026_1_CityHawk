type TemplateName = string;
export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateValue[]
  | { [key: string]: TemplateValue };
type CompiledTemplate = (context?: object) => string;

interface HandlebarsRuntime {
  compile(source: string): CompiledTemplate;
  registerPartial(name: string, source: string): void;
}

declare global {
  interface Window {
    Handlebars?: HandlebarsRuntime;
  }
}

const templateCache = new Map<TemplateName, CompiledTemplate>();
let isLoaded = false;

const templateAliases: Record<string, string> = {
  mood: 'home-mood-section',
};

function getHandlebars(): HandlebarsRuntime {
  if (!window.Handlebars) {
    throw new Error('Handlebars runtime is not loaded');
  }

  return window.Handlebars;
}

function getTemplateNameFromPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop() || '';
  return filename.replace(/\.hbs$/i, '');
}

function isPageTemplate(path: string): boolean {
  return path.startsWith('./pages/') || path === './app/app-error.hbs';
}

export async function loadTemplates(): Promise<void> {
  if (isLoaded) {
    return;
  }

  const Handlebars = getHandlebars();
  const templatesContext: __WebpackModuleApi.RequireContext = require.context('../../', true, /\.hbs$/);
  const templatePaths = templatesContext.keys();
  const knownTemplatePaths = new Map<string, string>();

  templatePaths.forEach((path) => {
    const name = getTemplateNameFromPath(path);
    const previousPath = knownTemplatePaths.get(name);

    if (previousPath) {
      throw new Error(`Duplicate template name "${name}" in ${previousPath} and ${path}`);
    }

    knownTemplatePaths.set(name, path);

    const source = templatesContext(path);
    if (!isPageTemplate(path)) {
      Handlebars.registerPartial(name, source);
    }

    templateCache.set(name, Handlebars.compile(source));
  });

  Object.entries(templateAliases).forEach(([alias, targetName]) => {
    const targetTemplate = templateCache.get(targetName);

    if (!targetTemplate) {
      throw new Error(`Template alias target "${targetName}" is not loaded`);
    }

    templateCache.set(alias, targetTemplate);
  });

  isLoaded = true;
}

export function renderTemplate<T extends object>(name: string, context?: T): string {
  const template = templateCache.get(name);

  if (!template) {
    throw new Error(`Template "${name}" is not loaded`);
  }

  return template(context || {});
}
