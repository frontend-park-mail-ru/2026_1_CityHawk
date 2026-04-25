import { renderTemplate } from '../../../app/templates/renderer.js';

export interface SelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

export interface EventListFiltersState {
  categories?: SelectOption[];
  tags?: SelectOption[];
  datePresetOptions?: SelectOption[];
  sortOptions?: SelectOption[];
}

export interface EventListFiltersOptions {
  onSubmit?: (form: HTMLFormElement) => void;
  onChange?: (form: HTMLFormElement) => void;
}

export function renderEventListFilters(state: EventListFiltersState = {}): string {
  const categories = Array.isArray(state.categories) ? state.categories : [];
  const tags = Array.isArray(state.tags) ? state.tags : [];
  const datePresetOptions = Array.isArray(state.datePresetOptions) ? state.datePresetOptions : [];
  const sortOptions = Array.isArray(state.sortOptions) ? state.sortOptions : [];

  return renderTemplate('event-list-filters', {
    categories,
    tags,
    datePresetOptions,
    sortOptions,
    hasCategories: categories.length > 0,
    hasTags: tags.length > 0,
    hasDatePresetOptions: datePresetOptions.length > 0,
    hasSortOptions: sortOptions.length > 0,
    hasAnyFilters: categories.length > 0 || tags.length > 0 || datePresetOptions.length > 0 || sortOptions.length > 0,
  });
}

export function attachEventListFilters(
  root: ParentNode,
  options: EventListFiltersOptions = {},
): () => void {
  const form = root.querySelector('[data-role="event-list-filter-form"]');
  const detachCustomSelects = form instanceof HTMLFormElement
    ? attachCustomDropdowns(form)
    : () => {};

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (form instanceof HTMLFormElement && typeof options.onSubmit === 'function') {
      options.onSubmit(form);
    }
  };

  const handleChange = (event: Event) => {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (!target.classList.contains('event-list-filters__input')) {
      return;
    }

    if (typeof options.onChange === 'function') {
      options.onChange(form);
    }
  };

  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('change', handleChange);
  }

  return () => {
    detachCustomSelects();

    if (form instanceof HTMLFormElement) {
      form.removeEventListener('submit', handleSubmit);
      form.removeEventListener('change', handleChange);
    }
  };
}

function attachCustomDropdowns(form: HTMLFormElement): () => void {
  const selects = Array.from(form.querySelectorAll<HTMLSelectElement>('select.event-list-filters__input'));
  const detachList: Array<() => void> = [];
  let openMenu: HTMLElement | null = null;

  const closeOpenMenu = () => {
    if (!openMenu) {
      return;
    }

    const trigger = openMenu.closest('.event-list-filters__custom-select')
      ?.querySelector<HTMLButtonElement>('.event-list-filters__custom-trigger');
    openMenu.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    openMenu = null;
  };

  selects.forEach((select) => {
    const field = select.closest('.event-list-filters__field');
    if (!(field instanceof HTMLElement)) {
      return;
    }

    const optionItems = Array.from(select.options).map((option) => ({
      value: option.value,
      label: option.textContent || '',
    }));

    const custom = document.createElement('div');
    custom.className = 'event-list-filters__custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'event-list-filters__custom-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const menu = document.createElement('div');
    menu.className = 'event-list-filters__custom-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    optionItems.forEach((item) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'event-list-filters__custom-option';
      optionButton.dataset.value = item.value;
      optionButton.textContent = item.label;
      menu.append(optionButton);
    });

    custom.append(trigger, menu);
    field.append(custom);
    select.classList.add('event-list-filters__input--hidden');

    const sync = () => {
      const selectedOption = select.selectedOptions.item(0);
      trigger.textContent = selectedOption?.textContent || optionItems[0]?.label || '';
      trigger.classList.toggle('event-list-filters__custom-trigger--active', select.value !== '');

      Array.from(menu.querySelectorAll<HTMLButtonElement>('.event-list-filters__custom-option'))
        .forEach((button) => {
          const isActive = button.dataset.value === select.value;
          button.classList.toggle('event-list-filters__custom-option--active', isActive);
          button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    };

    sync();

    const handleTriggerClick = () => {
      if (openMenu && openMenu !== menu) {
        closeOpenMenu();
      }

      if (menu.hidden) {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        openMenu = menu;
      } else {
        closeOpenMenu();
      }
    };

    const handleMenuClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const optionButton = target.closest<HTMLButtonElement>('.event-list-filters__custom-option');
      if (!(optionButton instanceof HTMLButtonElement)) {
        return;
      }

      const value = String(optionButton.dataset.value || '');
      if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      closeOpenMenu();
    };

    const handleDocumentClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!custom.contains(target)) {
        if (openMenu === menu) {
          closeOpenMenu();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenu === menu) {
        closeOpenMenu();
      }
    };

    const handleSelectChange = () => {
      sync();
    };

    trigger.addEventListener('click', handleTriggerClick);
    menu.addEventListener('click', handleMenuClick);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    select.addEventListener('change', handleSelectChange);

    detachList.push(() => {
      trigger.removeEventListener('click', handleTriggerClick);
      menu.removeEventListener('click', handleMenuClick);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      select.removeEventListener('change', handleSelectChange);
      select.classList.remove('event-list-filters__input--hidden');
      custom.remove();
      if (openMenu === menu) {
        openMenu = null;
      }
    });
  });

  return () => {
    closeOpenMenu();
    detachList.forEach((detach) => detach());
  };
}
