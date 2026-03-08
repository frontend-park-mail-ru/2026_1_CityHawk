import { pageLayout } from '../templates/layout.js';

export function homePage() {
  return pageLayout({
    title: 'CityHawk',
    description: 'Главная страница приложения.',
  });
}
