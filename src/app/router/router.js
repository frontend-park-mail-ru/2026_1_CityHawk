/**
 * @typedef {Object} RouteContext
 * @property {string} path Текущий путь.
 * @property {(path: string, options?: { replace?: boolean }) => void} navigate Функция перехода по маршруту.
 */

/**
 * @typedef {Object} RouteView
 * @property {string} html HTML-разметка страницы.
 * @property {(root: HTMLElement) => (void | (() => void))} [mount] Функция инициализации после рендера.
 */

/**
 * @typedef {(context: RouteContext) => string | RouteView | Promise<string | RouteView>} RouteRenderer
 * Функция, которая возвращает строку HTML или объект представления для маршрута.
 */

/**
 * Клиентский роутер для простого перехода между страницами по пути.
 */
export class Router {
  /**
   * @param {{
   *   root: HTMLElement,
   *   routes: Record<string, RouteRenderer>,
   *   notFound: RouteRenderer
   * }} options Параметры роутера.
   */
  constructor({ root, routes, notFound }) {
    this.root = root;
    this.routes = routes;
    this.notFound = notFound;
    this.cleanup = null;
    this.onPopState = this.onPopState.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  /**
   * Запускает роутер, подписывается на события браузера и рендерит текущий маршрут.
   */
  start() {
    window.addEventListener('popstate', this.onPopState);
    document.addEventListener('click', this.onDocumentClick);
    this.renderByPath(window.location.pathname);
  }

  /**
   * Выполняет переход на маршрут и при необходимости заменяет текущую запись в истории.
   *
   * @param {string} path Целевой путь.
   * @param {{ replace?: boolean }} [options] Дополнительные параметры перехода.
   */
  navigate(path, { replace = false } = {}) {
    const resolvedPath = typeof path === 'string' && path ? path : '/';
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', resolvedPath);
    this.renderByPath(resolvedPath);
  }

  /**
   * Перерисовывает приложение для текущего адреса в браузере.
   *
   * @returns {void}
   */
  onPopState() {
    this.renderByPath(window.location.pathname);
  }

  /**
   * Перехватывает клики по внутренним ссылкам и обрабатывает их без полной перезагрузки страницы.
   *
   * @param {MouseEvent} event Событие клика.
   */
  onDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link) {
      return;
    }

    if (link.target && link.target !== '_self') {
      return;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return;
    }

    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) {
      return;
    }

    event.preventDefault();
    this.navigate(new URL(href, window.location.origin).pathname);
  }

  /**
   * Находит обработчик маршрута по пути и монтирует возвращённое представление.
   *
   * @param {string} path Путь для рендера.
   * @returns {Promise<void>}
   */
  async renderByPath(path) {
    if (typeof this.cleanup === 'function') {
      this.cleanup();
      this.cleanup = null;
    }

    const renderer = this.routes[path] || this.notFound;
    const view = await renderer({ path, navigate: this.navigate.bind(this) });
    const html = typeof view === 'string' ? view : view?.html || '';

    this.root.innerHTML = html;

    if (view && typeof view.mount === 'function') {
      const cleanup = view.mount(this.root);
      if (typeof cleanup === 'function') {
        this.cleanup = cleanup;
      }
    }
  }
}
