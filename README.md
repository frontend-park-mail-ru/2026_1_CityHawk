# CityHawk

Сервис для поиска и управления мероприятиями: регистрация, авторизация, профиль, каталог/поиск, создание и редактирование событий.

## Демо

- Frontend: http://cityhawk.ru
- Backend API: http://cityhawk.ru:8080

## Что реализовано

### Архитектура и технологии

- SPA без перезагрузки страниц (History API + клиентский роутер)
- TypeScript + ES6 modules
- Сборка: Webpack
- Транспиляция: Babel
- Шаблоны и компонентный подход: Handlebars (`.hbs`)
- CSS-методология: БЭМ
- Постпроцессинг CSS: PostCSS + Autoprefixer
- Service Worker и кэширование для офлайн-режима

### Основные пользовательские сценарии

- Авторизация с валидацией
- Регистрация с валидацией
- Профиль пользователя
- Подборки мероприятий
- Список мероприятий с фильтрами
- Поиск по мероприятиям/категориям/тегам
- Страница мероприятия
- Создание мероприятия
- Редактирование мероприятия
- Удаление мероприятия

## Роутинг

- `/` — главная
- `/events` — список мероприятий
- `/events/new` — создание мероприятия
- `/events/:eventId` — карточка мероприятия
- `/events/:eventId/edit` — редактирование
- `/events/:eventId/delete` — удаление
- `/login` — вход
- `/register` — регистрация
- `/profile` — профиль
- `/password_reset` — восстановление пароля

## Установка и запуск

### 1) Локально (dev)

```bash
npm ci
npm run dev
```

Frontend поднимется на `http://localhost:3000`.

### 2) Production-like запуск

```bash
npm run build
npm start
```

### 3) Docker

```bash
docker compose up --build
```

## Переменные окружения

- `PORT` — порт frontend-сервера (по умолчанию `3000`)
- `API_BASE_URL` — базовый URL backend API (по умолчанию `http://localhost:8080`)

`API_BASE_URL` прокидывается во фронтенд через `/runtime-config.js`.

## CORS и cookies

Для корректной авторизации через cookies backend должен:

- разрешать origin фронтенда;
- отвечать с `Access-Control-Allow-Credentials: true`;
- использовать совместимые cookie-атрибуты (`SameSite`, `Secure`) для вашего окружения;
- обрабатывать preflight (`OPTIONS`) для нужных методов и заголовков.



## Структура проекта

- `src/` — клиентское приложение
- `src/app/` — бутстрап, роутер, рендеринг шаблонов, регистрация SW
- `src/pages/` — страницы приложения
- `src/modules/` — переиспользуемые модули/фичи
- `src/components/` — UI-компоненты
- `src/api/` — API-клиент и адаптеры
- `server/` — сервер для раздачи фронта
- `dist/`, `server-dist/` — сборочные артефакты

## NPM-скрипты

- `npm run dev` — запуск webpack-dev-server
- `npm run build` — сборка фронтенда + сервера
- `npm run build:server` — сборка только `server/`
- `npm start` — запуск собранного сервера
- `npm run lint` — проверка eslint
- `npm run lint:fix` — автофикс eslint
