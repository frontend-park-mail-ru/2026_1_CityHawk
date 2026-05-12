import { showToast } from '../../app/ui/toast.js';
import { renderTemplate } from '../../app/templates/renderer.js';

type SupportIframeState = 'closed' | 'opening' | 'opened' | 'load_error';

const STORAGE_KEY = 'cityhawk_support_open';
const SUPPORT_WIDGET_PATH = '/support-widget';

function isSupportRoute(): boolean {
  return window.location.pathname.startsWith(SUPPORT_WIDGET_PATH);
}

function getWidgetSrc(): string {
  return `${window.location.origin}${SUPPORT_WIDGET_PATH}`;
}

let state: SupportIframeState = localStorage.getItem(STORAGE_KEY) === '1' ? 'opening' : 'closed';
let root: HTMLDivElement | null = null;

const render = (): void => {
  if (!(root instanceof HTMLDivElement)) {
    return;
  }

  const isOpen = state !== 'closed';
  root.innerHTML = isOpen
    ? renderTemplate('support-launcher-panel', {
      state,
      isOpening: state === 'opening',
      isLoadError: state === 'load_error',
      widgetSrc: getWidgetSrc(),
    })
    : '';
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

function ensureSupportLauncher(): void {
  if (isSupportRoute() || root instanceof HTMLDivElement) {
    return;
  }

  root = document.createElement('div');
  root.className = 'support-launcher';
  root.dataset.role = 'support-launcher';

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('[data-action="support-close"]')) {
      close();
    }
  });

  root.addEventListener(
    'load',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement && target.dataset.role === 'support-iframe') {
        if (state !== 'opened') {
          state = 'opened';
          render();
        }
      }
    },
    true,
  );

  root.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement && target.dataset.role === 'support-iframe') {
        state = 'load_error';
        render();
      }
    },
    true,
  );

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && state !== 'closed') {
      close();
    }
  });

  window.addEventListener('message', (event: MessageEvent) => {
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
  });

  document.body.append(root);
  render();
}

export function initSupportLauncher(): void {
  ensureSupportLauncher();
}

export function openSupportLauncher(): void {
  ensureSupportLauncher();
  if (!isSupportRoute()) {
    open();
  }
}

export function closeSupportLauncher(): void {
  if (root instanceof HTMLDivElement) {
    close();
  }
}
