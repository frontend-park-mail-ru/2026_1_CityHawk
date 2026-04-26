import './support-widget.css';
import {
  createSupportMessage,
  createSupportTicket,
  getSupportMessages,
  getSupportTicket,
  getSupportTickets,
  updateSupportTicket,
} from '../../api/support.api.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { SUPPORT_CATEGORY_OPTIONS } from '../../modules/support/support.constants.js';
import {
  formatSupportCategory,
  formatSupportDate,
  formatSupportStatus,
  getSupportErrorMessage,
} from '../../modules/support/support-format.js';
import type {
  CreateSupportTicketPayload,
  SupportCategory,
  SupportMessage,
  SupportStatus,
  SupportTicket,
} from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface TicketViewModel {
  id: string;
  shortId: string;
  title: string;
  message: string;
  categoryLabel: string;
  statusBadge: string;
  createdAtText: string;
}

function renderStatusBadge(status: SupportStatus): string {
  return renderTemplate('support-status-badge', {
    status,
    label: formatSupportStatus(status),
  });
}

function escapeHtml(value: string): string {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function mapTicket(ticket: SupportTicket): TicketViewModel {
  return {
    id: ticket.id,
    shortId: ticket.id.slice(0, 8),
    title: ticket.title,
    message: ticket.message,
    categoryLabel: formatSupportCategory(ticket.category),
    statusBadge: renderStatusBadge(ticket.status),
    createdAtText: formatSupportDate(ticket.createdAt),
  };
}

function mapMessages(messages: SupportMessage[]): object[] {
  return messages.map((message) => ({
    ...message,
    authorLabel: message.authorRole === 'admin' ? 'Администратор' : 'Пользователь',
    createdAtText: formatSupportDate(message.createdAt),
  }));
}

function getCategoryOptions(selectedCategory?: string): object[] {
  return SUPPORT_CATEGORY_OPTIONS.map((option) => ({
    ...option,
    selected: option.value === selectedCategory,
  }));
}

function renderTicketForm(ticket?: Partial<SupportTicket>, submitText = 'Создать обращение'): string {
  return renderTemplate('support-ticket-form', {
    categories: getCategoryOptions(ticket?.category),
    title: ticket?.title || '',
    message: ticket?.message || '',
    submitText,
  });
}

function renderTicketList(tickets: SupportTicket[]): string {
  const ticketItems = tickets.map(mapTicket);

  return renderTemplate('support-ticket-list', {
    tickets: ticketItems,
    hasTickets: ticketItems.length > 0,
  });
}

function validateTicketPayload(payload: CreateSupportTicketPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!payload.category) {
    errors.category = 'Выберите категорию';
  }
  if (!payload.title.trim()) {
    errors.title = 'Введите тему';
  }
  if (!payload.message.trim()) {
    errors.message = 'Введите сообщение';
  } else if (payload.message.trim().length < 10) {
    errors.message = 'Сообщение должно быть не короче 10 символов';
  }

  return errors;
}

function readTicketPayload(form: HTMLFormElement): CreateSupportTicketPayload {
  const formData = new FormData(form);

  return {
    category: String(formData.get('category') || '') as SupportCategory,
    title: String(formData.get('title') || '').trim(),
    message: String(formData.get('message') || '').trim(),
  };
}

function setFormErrors(form: HTMLFormElement, errors: Record<string, string>): void {
  form.querySelectorAll('[data-error-for]').forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const key = node.dataset.errorFor || '';
    node.textContent = errors[key] || '';
  });
}

function postParentMessage(type: string): void {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type }, window.location.origin);
  }
}

async function getWidgetHomeContent(): Promise<string> {
  let latestTickets: SupportTicket[] = [];
  let errorMessage = '';

  try {
    const response = await getSupportTickets({ limit: 5, offset: 0 });
    latestTickets = Array.isArray(response.items) ? response.items : [];
  } catch (error) {
    errorMessage = getSupportErrorMessage(error, 'Не удалось загрузить обращения');
  }

  return [
    '<section class="support-section">',
    '<div class="support-section__head">',
    '<h2 class="support-section__title">Поддержка CityHawk</h2>',
    '<a class="support-button support-button--small" href="/support-widget/new">Создать</a>',
    '</div>',
    '<p class="support-empty">Создайте новое обращение или откройте историю переписки по уже созданным заявкам.</p>',
    '</section>',
    '<section class="support-section">',
    '<div class="support-section__head">',
    '<h2 class="support-section__title">Последние обращения</h2>',
    '<a class="support-link" href="/support-widget/tickets">Все</a>',
    '</div>',
    errorMessage ? `<p class="support-alert support-alert--error">${escapeHtml(errorMessage)}</p>` : renderTicketList(latestTickets),
    '</section>',
  ].join('');
}

async function getTicketListContent(): Promise<string> {
  const response = await getSupportTickets({ limit: 100, offset: 0 });
  const tickets = Array.isArray(response.items) ? response.items : [];

  return [
    '<section class="support-section">',
    '<div class="support-section__head">',
    '<h2 class="support-section__title">Мои обращения</h2>',
    '<a class="support-button support-button--small" href="/support-widget/new">Создать</a>',
    '</div>',
    renderTicketList(tickets),
    '</section>',
  ].join('');
}

async function getTicketDetailsContent(ticketId: string): Promise<string> {
  const [ticket, messagesResponse] = await Promise.all([
    getSupportTicket(ticketId),
    getSupportMessages(ticketId),
  ]);
  const messages = Array.isArray(messagesResponse.items) ? messagesResponse.items : [];
  const isClosed = ticket.status === 'closed';

  return [
    '<section class="support-section support-section--details">',
    '<a class="support-link" href="/support-widget/tickets">← К списку</a>',
    '<div class="support-details">',
    `<div class="support-details__row"><span>Номер</span><strong>#${escapeHtml(ticket.id.slice(0, 8))}</strong></div>`,
    `<div class="support-details__row"><span>Категория</span><strong>${escapeHtml(formatSupportCategory(ticket.category))}</strong></div>`,
    `<div class="support-details__row"><span>Статус</span>${renderStatusBadge(ticket.status)}</div>`,
    `<div class="support-details__row"><span>Создано</span><strong>${escapeHtml(formatSupportDate(ticket.createdAt))}</strong></div>`,
    `<div class="support-details__row"><span>Обновлено</span><strong>${escapeHtml(formatSupportDate(ticket.updatedAt))}</strong></div>`,
    '</div>',
    `<h2 class="support-section__title">${escapeHtml(ticket.title)}</h2>`,
    `<p class="support-details__message">${escapeHtml(ticket.message)}</p>`,
    '</section>',
    '<section class="support-section">',
    '<h2 class="support-section__title">Редактировать обращение</h2>',
    isClosed
      ? '<p class="support-empty">Закрытое обращение нельзя редактировать.</p>'
      : renderTicketForm(ticket, 'Сохранить изменения'),
    '</section>',
    '<section class="support-section">',
    '<h2 class="support-section__title">Переписка</h2>',
    renderTemplate('support-messages', {
      messages: mapMessages(messages),
      hasMessages: messages.length > 0,
    }),
    renderTemplate('support-message-form', {
      disabled: isClosed,
    }),
    '</section>',
  ].join('');
}

function attachTicketForm(
  root: HTMLElement,
  onSubmit: (payload: CreateSupportTicketPayload, form: HTMLFormElement) => Promise<void>,
): void {
  const form = root.querySelector('[data-role="support-ticket-form"]');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = readTicketPayload(form);
    const errors = validateTicketPayload(payload);
    setFormErrors(form, errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    void onSubmit(payload, form);
  });
}

function attachMessageForm(root: HTMLElement, ticketId: string, navigate: RouteContext['navigate']): void {
  const form = root.querySelector('[data-role="support-message-form"]');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const body = String(new FormData(form).get('body') || '').trim();
    const errors = body ? {} : { body: 'Введите сообщение' };
    setFormErrors(form, errors);

    if (!body) {
      return;
    }

    const messageNode = form.querySelector('[data-role="support-message-form-message"]');
    if (messageNode instanceof HTMLElement) {
      messageNode.textContent = 'Отправляем...';
    }

    void createSupportMessage(ticketId, { body })
      .then(() => navigate(`/support-widget/tickets/${ticketId}`, { replace: true }))
      .catch((error) => {
        if (messageNode instanceof HTMLElement) {
          messageNode.textContent = getSupportErrorMessage(error, 'Не удалось отправить сообщение');
        }
      });
  });
}

function renderWidget(content: string, path: string, errorMessage = ''): string {
  return renderTemplate('support-widget', {
    content,
    errorMessage,
    isHome: path === '/support-widget',
    isNew: path === '/support-widget/new',
    isTickets: path.startsWith('/support-widget/tickets'),
  });
}

export async function supportWidgetPage(context: RouteContext): Promise<RouteView> {
  const { path, params, navigate } = context;
  let content = '';
  let errorMessage = '';

  try {
    if (path === '/support-widget' || path === '/support-widget/new') {
      content = path === '/support-widget'
        ? await getWidgetHomeContent()
        : `<section class="support-section"><h2 class="support-section__title">Новое обращение</h2>${renderTicketForm()}</section>`;
    } else if (path === '/support-widget/tickets') {
      content = await getTicketListContent();
    } else {
      content = await getTicketDetailsContent(params.id || '');
    }
  } catch (error) {
    errorMessage = getSupportErrorMessage(error, 'Не удалось загрузить поддержку');
    content = '<section class="support-section"><p class="support-empty">Попробуйте обновить страницу позже.</p></section>';
  }

  return {
    html: renderWidget(content, path, errorMessage),
    mount(root) {
      if (path === '/support-widget/new') {
        attachTicketForm(root, async (payload, form) => {
          const messageNode = form.querySelector('[data-role="support-ticket-form-message"]');
          if (messageNode instanceof HTMLElement) {
            messageNode.textContent = 'Создаём обращение...';
          }

          try {
            await createSupportTicket(payload);
            postParentMessage('support:ticket-created');
            navigate('/support-widget/tickets', { replace: true });
          } catch (error) {
            if (messageNode instanceof HTMLElement) {
              messageNode.textContent = getSupportErrorMessage(error, 'Не удалось создать обращение');
            }
          }
        });
      } else if (path.startsWith('/support-widget/tickets/') && params.id) {
        attachTicketForm(root, async (payload, form) => {
          const messageNode = form.querySelector('[data-role="support-ticket-form-message"]');
          if (messageNode instanceof HTMLElement) {
            messageNode.textContent = 'Сохраняем...';
          }

          try {
            await updateSupportTicket(params.id, payload);
            navigate(`/support-widget/tickets/${params.id}`, { replace: true });
          } catch (error) {
            if (messageNode instanceof HTMLElement) {
              messageNode.textContent = getSupportErrorMessage(error, 'Не удалось обновить обращение');
            }
          }
        });
        attachMessageForm(root, params.id, navigate);
      }
    },
  };
}
