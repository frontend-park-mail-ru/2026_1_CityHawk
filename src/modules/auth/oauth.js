import { API_BASE_URL } from '../../api/config.js';

const OAUTH_PROVIDERS = ['google', 'yandex', 'vk'];

/**
 * Запускает OAuth-авторизацию через backend редирект.
 *
 * @param {'google' | 'yandex' | 'vk'} provider OAuth-провайдер.
 * @returns {void}
 */
export function startOAuth(provider) {
  if (!OAUTH_PROVIDERS.includes(provider)) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  window.location.assign(`${API_BASE_URL}/auth/${provider}/login`);
}

/**
 * Подключает обработчики OAuth-кнопок в переданном контейнере.
 *
 * @param {ParentNode} root Корневой контейнер страницы.
 * @returns {void}
 */
export function attachOAuthButtons(root) {
  const buttonToProvider = [
    ['.login__oauth-btn--google', 'google'],
    ['.login__oauth-btn--yandex', 'yandex'],
    ['.login__oauth-btn--vk', 'vk'],
  ];

  buttonToProvider.forEach(([selector, provider]) => {
    const button = root.querySelector(selector);
    if (!button) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      startOAuth(provider);
    });
  });
}
