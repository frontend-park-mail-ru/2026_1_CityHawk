# CityHawk Frontend

Фронтенд проекта CityHawk на TypeScript.

Проект состоит из двух частей:
- клиентское SPA в `src/`, которое собирается через `webpack`
- небольшой `express`-сервер в `server/index.ts`, который отдает собранный фронтенд и runtime-конфиг

## Стек

- TypeScript
- Webpack
- Express
- Handlebars partials/templates

## Структура

- `src/` — клиентское приложение
- `server/` — серверная часть на TypeScript
- `public/` — статические файлы
- `dist/` — сборка фронтенда
- `server-dist/` — собранный сервер

## Скрипты

- `npm run dev` — локальная разработка через `webpack-dev-server`
- `npm run build` — собирает фронтенд и сервер
- `npm run build:server` — отдельно собирает `server/index.ts`
- `npm start` — запускает собранный сервер из `server-dist/index.js`
- `npm run lint` — проверка eslint
- `npm run lint:fix` — автоисправление eslint

## Локальный запуск

1. Установить зависимости:

```bash
npm ci
```

2. Для разработки фронтенда:

```bash
npm run dev
```

3. Для production-like запуска:

```bash
npm run build
npm start
```

## Переменные окружения

- `PORT` — порт frontend-сервера, по умолчанию `3000`
- `API_BASE_URL` — базовый URL backend API, по умолчанию `http://localhost:8080`

Сервер отдает runtime-конфиг в `/runtime-config.js` и пробрасывает туда `API_BASE_URL`.

## TypeScript

- клиент собирается по [tsconfig.json](/Users/alice/Desktop/2026_1_CityHawk/tsconfig.json:1)
- сервер собирается отдельно по [tsconfig.server.json](/Users/alice/Desktop/2026_1_CityHawk/tsconfig.server.json:1)

Исходный runtime-код проекта переведен на TypeScript: клиент находится в `src/`, сервер в `server/index.ts`.
