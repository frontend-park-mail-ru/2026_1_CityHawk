import { showToast } from '../../app/ui/toast.js';

type SupportIframeState = 'closed' | 'opening' | 'opened' | 'load_error';

const STORAGE_KEY = 'cityhawk_support_open';
const SUPPORT_WIDGET_PATH = '/support-widget';

function isSupportRoute(): boolean {
  return window.location.pathname.startsWith(SUPPORT_WIDGET_PATH);
}

function getWidgetSrc(): string {
  return `${window.location.origin}${SUPPORT_WIDGET_PATH}`;
}

export function initSupportLauncher(): void {
  if (isSupportRoute() || document.querySelector('[data-role="support-launcher"]')) {
    return;
  }

  let state: SupportIframeState = localStorage.getItem(STORAGE_KEY) === '1' ? 'opening' : 'closed';
  const root = document.createElement('div');
  root.className = 'support-launcher';
  root.dataset.role = 'support-launcher';

  const render = (): void => {
    const isOpen = state !== 'closed';
    const panelHtml = isOpen
      ? [
        `<section class="support-launcher__panel support-launcher__panel--${state}" aria-label="Поддержка">`,
        '<div class="support-launcher__bar">',
        '<span>Поддержка</span>',
        '<button class="support-launcher__close" type="button" data-action="support-close" aria-label="Закрыть поддержку">×</button>',
        '</div>',
        state === 'opening' ? '<p class="support-launcher__state">Загрузка...</p>' : '',
        state === 'load_error' ? '<p class="support-launcher__state">Не удалось загрузить поддержку.</p>' : '',
        `<iframe class="support-launcher__iframe" src="${getWidgetSrc()}" title="Поддержка CityHawk" data-role="support-iframe"></iframe>`,
        '</section>',
      ].join('')
      : '';

    root.innerHTML = [
      `<button class="support-launcher__button" type="button" data-action="support-open" ${isOpen ? 'hidden' : ''}>Поддержка</button>`,
      panelHtml,
    ].join('');
  };

  const open = (): void => {
    state = 'opening';
    localStorage.setItem(STORAGE_KEY, '1');
    render();
  };

  const close = (): void => {
    state = 'closed';
    localStorage.removeItem(STORAGE_KEY);
    render();
  };

  root.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('[data-action="support-open"]')) {
      open();
      return;
    }

    if (target.closest('[data-action="support-close"]')) {
      close();
    }
  });

  root.addEventListener('load', (event) => {
    const target = event.target;
    if (target instanceof HTMLIFrameElement && target.dataset.role === 'support-iframe') {
      if (state !== 'opened') {
        state = 'opened';
        render();
      }
    }
  }, true);

  root.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLIFrameElement && target.dataset.role === 'support-iframe') {
      state = 'load_error';
      render();
    }
  }, true);

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && state !== 'closed') {
      close();
    }
  };

  const handleMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data as { type?: string } | null;
    if (data?.type === 'support:close') {
      close();
    }
    if (data?.type === 'support:ticket-created') {
      showToast('Обращение создано', { type: 'success' });
    }
  };

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('message', handleMessage);
  document.body.append(root);
  render();
}
