import { API_BASE_URL } from '../../api/config.js';

const OAUTH_PROVIDERS = ['google', 'yandex', 'vk'] as const;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function startOAuth(provider: OAuthProvider): void {
  if (!OAUTH_PROVIDERS.includes(provider)) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  window.location.assign(`${API_BASE_URL}/api/auth/${provider}/login`);
}

export function attachOAuthButtons(root: ParentNode): void {
  const buttonToProvider: Array<[string, OAuthProvider]> = [
    ['.login__oauth-btn--google', 'google'],
    ['.login__oauth-btn--yandex', 'yandex'],
    ['.login__oauth-btn--vk', 'vk'],
  ];

  buttonToProvider.forEach(([selector, provider]) => {
    const button = root.querySelector(selector);
    if (!(button instanceof HTMLButtonElement)) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      startOAuth(provider);
    });
  });
}
