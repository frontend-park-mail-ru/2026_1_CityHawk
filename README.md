# 2026_1_CityHawk

Frontend server для проекта CityHawk

## Что реализовано

- Сервер на `express` в `server/index.js`
- Отдача статики из `public` и `src`
- SPA fallback на `public/index.html`
- Проксирование запросов в backend `2026_1_cityhawk_backend`:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /me`
  - `GET /health`
- Проксирование cookie (`Set-Cookie` от backend сохраняется в браузере)

