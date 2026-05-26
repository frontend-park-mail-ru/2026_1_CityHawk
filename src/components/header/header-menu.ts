import { openSupportLauncher } from '../support-launcher/support-launcher.js';

export function attachHeaderMenu(root: HTMLElement): () => void {
  const menus = Array.from(root.querySelectorAll<HTMLElement>('[data-role="header-menu"]'));
  const userMenus = Array.from(root.querySelectorAll<HTMLElement>('.site-header__user-menu'));
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

  userMenus.forEach((menu) => {
    const trigger = menu.querySelector<HTMLButtonElement>('[data-role="header-user-menu-trigger"]');
    const dropdown = menu.querySelector<HTMLElement>('.site-header__user-dropdown');

    if (!(trigger instanceof HTMLButtonElement) || !(dropdown instanceof HTMLElement)) {
      return;
    }

    const open = (): void => {
      menu.classList.add('site-header__user-menu--open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = (): void => {
      menu.classList.remove('site-header__user-menu--open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const toggle = (): void => {
      if (menu.classList.contains('site-header__user-menu--open')) {
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

    const handleDropdownClick = (event: Event): void => {
      const target = event.target;
      if (target instanceof Element && target.closest('a[href]')) {
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
    dropdown.addEventListener('click', handleDropdownClick);
    window.addEventListener('keydown', handleWindowKeydown);

    cleanups.push(() => {
      trigger.removeEventListener('click', handleTriggerClick);
      document.removeEventListener('click', handleDocumentClick);
      dropdown.removeEventListener('click', handleDropdownClick);
      window.removeEventListener('keydown', handleWindowKeydown);
      close();
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
