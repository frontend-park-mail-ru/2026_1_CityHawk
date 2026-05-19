import './support-statistics.css';
import { getMeOrNull } from '../../api/profile.api.js';
import { getSupportStats } from '../../api/support.api.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../../modules/support/support.constants.js';
import { getSupportErrorMessage } from '../../modules/support/support-format.js';
import type { SupportCategory, SupportStatus, SupportStats } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

function escapeHtml(value: string): string {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function toDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function getPercent(value: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function renderMetricCard(label: string, value: number): string {
  return [
    '<article class="support-statistics__card">',
    `<span>${escapeHtml(label)}</span>`,
    `<strong>${Number(value || 0)}</strong>`,
    '</article>',
  ].join('');
}

function renderBreakdown<TValue extends string>(
  title: string,
  labels: Record<TValue, string>,
  values: Record<TValue, number>,
  total: number,
): string {
  const rows = Object.entries(labels).map(([key, label]) => {
    const value = Number(values[key as TValue] || 0);
    const percent = getPercent(value, total);

    return [
      '<div class="support-statistics__bar-row">',
      '<div class="support-statistics__bar-head">',
      `<span>${escapeHtml(String(label))}</span>`,
      `<strong>${value}</strong>`,
      '</div>',
      '<div class="support-statistics__bar-track">',
      `<span class="support-statistics__bar-fill" style="width: ${percent}%"></span>`,
      '</div>',
      '</div>',
    ].join('');
  }).join('');

  return [
    '<article class="support-statistics__breakdown">',
    `<h2>${escapeHtml(title)}</h2>`,
    rows,
    '</article>',
  ].join('');
}

function renderStats(stats: SupportStats): string {
  return [
    '<div class="support-statistics__cards">',
    renderMetricCard('Всего', stats.total),
    renderMetricCard('Открыто', stats.openTotal),
    renderMetricCard('В работе', stats.inProgressTotal),
    renderMetricCard('Закрыто', stats.closedTotal),
    '</div>',
    '<div class="support-statistics__grid">',
    renderBreakdown<SupportStatus>('По статусам', SUPPORT_STATUSES, stats.byStatus, stats.total),
    renderBreakdown<SupportCategory>('По категориям', SUPPORT_CATEGORIES, stats.byCategory, stats.total),
    '</div>',
  ].join('');
}

function getStatsFilters(): { from: string; to: string; fromInput: string; toInput: string } {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  return {
    from,
    to,
    fromInput: toDateTimeLocal(from),
    toInput: toDateTimeLocal(to),
  };
}

export async function supportStatisticsPage({ navigate }: RouteContext): Promise<RouteView> {
  const me = await getMeOrNull();
  const forbidden = me?.role !== 'admin';
  const filters = getStatsFilters();
  let content = '';
  let errorMessage = '';

  if (!forbidden) {
    try {
      const stats = await getSupportStats({
        from: filters.from,
        to: filters.to,
      });
      content = renderStats(stats);
    } catch (error) {
      errorMessage = getSupportErrorMessage(error, 'Не удалось загрузить статистику');
      content = '';
    }
  }

  return {
    html: renderTemplate('support-statistics', {
      forbidden,
      errorMessage,
      content,
      from: filters.fromInput,
      to: filters.toInput,
    }),
    mount(root) {
      const form = root.querySelector('[data-role="support-stats-filter"]');

      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const params = new URLSearchParams();
        const from = fromDateTimeLocal(String(formData.get('from') || ''));
        const to = fromDateTimeLocal(String(formData.get('to') || ''));

        if (from) {
          params.set('from', from);
        }
        if (to) {
          params.set('to', to);
        }

        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/support/statistics${suffix}`);
      });
    },
  };
}
