import { openSupportLauncher } from '../support-launcher/support-launcher.js';

export function attachHeaderMenu(root: HTMLElement): () => void {
  const menus = Array.from(root.querySelectorAll<HTMLElement>('[data-role="header-menu"]'));
  const cleanups: Array<() => void> = [];

  menus.forEach((menu) => {
    const trigger = menu.querySelector<HTMLButtonElement>('[data-role="header-menu-trigger"]');
    const sidebar = menu.querySelector<HTMLElement>('[data-role="header-menu-sidebar"]');

    if (!(trigger instanceof HTMLButtonElement) || !(sidebar instanceof HTMLElement)) {
      return;
    }

    const open = (): void => {
      menu.classList.add('site-header__menu--open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = (): void => {
      menu.classList.remove('site-header__menu--open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const toggle = (): void => {
      if (menu.classList.contains('site-header__menu--open')) {
        close();
        return;
      }
      open();
    };

    const handleTriggerClick = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    };

    const handleDocumentClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!menu.contains(target)) {
        close();
      }
    };

    const handleSidebarClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const supportLink = target.closest('[data-action="open-support-launcher"]');
      if (supportLink instanceof HTMLAnchorElement) {
        event.preventDefault();
        openSupportLauncher();
        close();
        return;
      }

      if (target.closest('a[href]')) {
        close();
      }
    };

    const handleWindowKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        close();
      }
    };

    trigger.addEventListener('click', handleTriggerClick);
    document.addEventListener('click', handleDocumentClick);
    sidebar.addEventListener('click', handleSidebarClick);
    window.addEventListener('keydown', handleWindowKeydown);

    cleanups.push(() => {
      trigger.removeEventListener('click', handleTriggerClick);
      document.removeEventListener('click', handleDocumentClick);
      sidebar.removeEventListener('click', handleSidebarClick);
      window.removeEventListener('keydown', handleWindowKeydown);
      close();
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
