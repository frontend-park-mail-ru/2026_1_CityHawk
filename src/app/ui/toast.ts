type ToastType = 'error' | 'success';

interface ShowToastOptions {
  type?: ToastType;
  durationMs?: number;
}

let hideTimerId: number | null = null;

function ensureToastRoot(): HTMLElement {
  let root = document.querySelector<HTMLElement>('[data-role="app-toast-root"]');

  if (!(root instanceof HTMLElement)) {
    root = document.createElement('div');
    root.className = 'app-toast-root';
    root.dataset.role = 'app-toast-root';
    document.body.append(root);
  }

  return root;
}

export function showToast(message: string, options: ShowToastOptions = {}): void {
  const text = String(message || '').trim();

  if (!text) {
    return;
  }

  const root = ensureToastRoot();
  const durationMs = Math.max(1200, Number(options.durationMs || 4200));
  const type = options.type === 'success' ? 'success' : 'error';

  root.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `app-toast app-toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = text;
  root.append(toast);

  requestAnimationFrame(() => {
    toast.classList.add('app-toast--visible');
  });

  if (hideTimerId) {
    window.clearTimeout(hideTimerId);
  }

  hideTimerId = window.setTimeout(() => {
    toast.classList.remove('app-toast--visible');
    window.setTimeout(() => {
      if (toast.parentElement === root) {
        root.innerHTML = '';
      }
    }, 180);
  }, durationMs);
}
