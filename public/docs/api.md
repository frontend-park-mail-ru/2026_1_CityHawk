# Документация API CityHawk

## Общая информация

API приложения CityHawk построено по REST-подходу.

Статус документа:

- обновлено под текущий frontend (ветка с картой и профилем)
- последняя актуализация: апрель 2026

Основные принципы:

- backend API использует префикс `/api`
- почти все запросы отправляются как `application/json`
- загрузка файлов выполняется через `multipart/form-data`
- все ответы API возвращаются в `application/json; charset=utf-8`
- даты и время передаются в UTC
- идентификаторы доменных сущностей обычно имеют строковый формат; в Postgres-данных это чаще всего `uuid`
- авторизация построена на cookie, а не на `Authorization: Bearer`

## Безопасность

### Cookie-аутентификация

После успешного `register`, `login`, `refresh` и OAuth-login сервер выставляет:

- `access_token` — `HttpOnly` cookie для доступа к защищенным endpoint'ам
- `refresh_token` — `HttpOnly` cookie для продления сессии
- `csrf_token` — cookie для защиты от CSRF

### CSRF-защита

Для изменяющих запросов с cookie-аутентификацией сервер требует CSRF-token по схеме double submit:

- cookie `csrf_token`
- header `X-CSRF-Token`

Для unsafe-методов (`POST`, `PATCH`, `DELETE`, `PUT`) значения должны совпадать.

Сейчас CSRF обязателен для:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `PATCH /api/me`
- `POST /api/events`
- `PATCH /api/events/{eventId}`
- `DELETE /api/events/{eventId}`
- `POST /api/events/{eventId}/invitations`
- `PATCH /api/invitations/{invitationId}`
- `POST /api/me/notifications/{notificationId}/read`
- `POST /api/me/notifications/read-all`
- `POST /api/events/{eventId}/share-links`

После успешного `register`, `login`, `refresh` и OAuth callback сервер также дублирует токен в response header `X-CSRF-Token`, чтобы фронтенд мог сохранить его и отправлять дальше.

### XSS-защита

Проект считает пользовательские поля обычным текстом, а не HTML.

- входные значения не санитайзятся как HTML
- при выдаче в API пользовательский текст экранируется
- это означает, что строка вида `<script>alert(1)</script>` вернется как безопасный текст

### SQL injection

Доступ к БД построен на параметризованных запросах `pgx`, поэтому пользовательский ввод не подставляется в SQL как сырая строка. Для динамических параметров вроде сортировки используются whitelist-ограничения.

## Формат ошибок

При ошибке API возвращает объект:

```json
{
  "error": "Validation failed",
  "details": {
    "field": "field is required"
  }
}
```

Общие статусы:

- `400 Bad Request` — ошибка валидации или формата запроса
- `401 Unauthorized` — пользователь не авторизован
- `403 Forbidden` — пользователь авторизован, но операция запрещена
- `404 Not Found` — сущность не найдена
- `409 Conflict` — конфликт состояния, например уже существующий пользователь
- `405 Method Not Allowed` — неподдерживаемый HTTP-метод

## Служебные endpoint'ы

### GET /api/health

Проверка доступности backend.

Успешный ответ:

```text
ok
```

### GET /openapi.yaml

Отдает OpenAPI-спецификацию.

### GET /swagger
### GET /swagger/

UI для просмотра OpenAPI.

### GET /runtime-config.js

Runtime-конфиг для frontend-клиента.

Успешный ответ:

```javascript
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:8080",
  YANDEX_MAPS_API_KEY: "<key-or-empty-string>"
};
```

Примечания:

- endpoint отдается frontend-server'ом
- используется для конфигурации базового API URL и ключа Yandex Maps

## Статические файлы

### GET /uploads/avatars/{filename}

Отдает сохраненный файл аватарки.

### GET /uploads/events/{filename}

Отдает сохраненное изображение события.

## Auth API

### POST /api/auth/register

Регистрация нового пользователя.

Тело запроса:

```json
{
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "password": "Secret123!",
  "birthday": "2004-01-12",
  "cityId": "11111111-1111-1111-1111-111111111111"
}
```

Поля:

- `email`, `username`, `userSurname`, `password` обязательны
- `birthday`, `cityId` опциональны

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "avatarUrl": null,
  "createdAt": "2026-03-23T10:00:00Z"
}
```

Побочные эффекты:

- сервер выставляет `access_token`, `refresh_token`, `csrf_token`
- сервер возвращает `X-CSRF-Token` в header

Возможные ошибки:

- `400 Validation failed`
- `409 User already exists`

### POST /api/auth/login

Логин пользователя.

Тело запроса:

```json
{
  "email": "user@mail.com",
  "password": "Secret123!"
}
```

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice"
}
```

Побочные эффекты:

- сервер выставляет `access_token`, `refresh_token`, `csrf_token`
- сервер возвращает `X-CSRF-Token` в header

Возможные ошибки:

- `400 Validation failed`
- `401 Invalid credentials`

### POST /api/auth/refresh

Продление сессии.

Требования:

- cookie `refresh_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Побочные эффекты:

- сервер перевыпускает `access_token`, `refresh_token`, `csrf_token`
- сервер возвращает новый `X-CSRF-Token` в header

Возможные ошибки:

- `401 Session expired`
- `403 CSRF token mismatch`
- `403 Invalid origin`

### POST /api/auth/logout

Завершение текущей сессии.

Требования:

- cookie `refresh_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

## Social API (Followers & Friends)

Раздел для подписок пользователей друг на друга и поиска друзей.

### GET /api/me/followers

Список пользователей, которые подписаны на текущего пользователя.

Query-параметры:

- `limit` (number, optional, default: `100`)
- `offset` (number, optional, default: `0`)

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "username": "Мария",
      "userSurname": "Соколова",
      "avatarUrl": "https://.../avatar.jpg",
      "city": {
        "id": "uuid",
        "name": "Москва",
        "countryName": "Россия",
        "timezone": "Europe/Moscow"
      },
      "isFollowing": true
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

Возможные ошибки:

- `401 Unauthorized`

### GET /api/me/following

Список пользователей, на которых подписан текущий пользователь.

Query-параметры:

- `limit` (number, optional, default: `100`)
- `offset` (number, optional, default: `0`)

Успешный ответ `200 OK`:

```json
{
  "items": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

Возможные ошибки:

- `401 Unauthorized`

### POST /api/users/{userId}/follow

Подписаться на пользователя.

Path-параметры:

- `userId` (uuid|string, required)

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `400 Invalid userId`
- `401 Unauthorized`
- `404 User not found`
- `409 Already following`

### DELETE /api/users/{userId}/follow

Отписаться от пользователя.

Path-параметры:

- `userId` (uuid|string, required)

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `400 Invalid userId`
- `401 Unauthorized`
- `404 User not found`

## Search API

### GET /api/search

Поиск по пользователям и событиям для строки поиска (используется в хедере и для поиска друзей).

Query-параметры:

- `query` (string, required)
- `limit` (number, optional, default: `5`)

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "user",
      "title": "Мария Соколова",
      "label": "@maria"
    },
    {
      "id": "uuid",
      "type": "event",
      "title": "Futurione",
      "label": "Выставка"
    }
  ]
}
```

Примечания для backend:

- `items` может содержать как объекты, так и строки (для совместимости со старым клиентом).
- Для `type=user` желательно возвращать `id`, чтобы frontend мог переходить на профиль.
- Для `type=event` желательно возвращать `id`, чтобы frontend мог переходить на страницу события.

## Organizer Applications API (draft)

Раздел для страницы `/organizer/apply`.

### POST /api/organizer/applications

Создать заявку на роль организатора.

Тело запроса:

```json
{
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "phone": "+79000000000",
  "city": "Москва",
  "projectName": "North Art Lab",
  "categories": "Концерты, Выставки",
  "links": "https://example.com",
  "about": "Организуем события 2 года...",
  "consent": true
}
```

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "status": "pending",
  "createdAt": "2026-05-09T10:00:00Z"
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `409 Active application already exists`

Frontend integration (текущее поведение клиента):

- страница `/organizer/apply` отправляет `POST /api/organizer/applications`
- валидация обязательных полей делается нативно в браузере (`required`)
- при `201` форма скрывается и показывается блок "Заявка отправлена"
- при ошибке backend текст из поля `error` показывается пользователю через toast

### GET /api/organizer/applications/me

Получить текущую заявку авторизованного пользователя.

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "status": "pending",
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "phone": "+79000000000",
  "city": "Москва",
  "projectName": "North Art Lab",
  "categories": "Концерты, Выставки",
  "links": "https://example.com",
  "about": "Организуем события 2 года...",
  "reviewComment": "",
  "createdAt": "2026-05-09T10:00:00Z",
  "updatedAt": "2026-05-09T10:00:00Z"
}
```

### PATCH /api/admin/organizer/applications/{applicationId}

Админ меняет статус заявки.

Тело запроса:

```json
{
  "status": "approved",
  "reviewComment": "Проверено, можно открывать доступ."
}
```

Поддерживаемые `status`:

- `pending`
- `needs_info`
- `approved`
- `rejected`

Побочные эффекты:

- сервер очищает `access_token`, `refresh_token`, `csrf_token`

Возможные ошибки:

- `401 Session expired`
- `403 CSRF token mismatch`
- `403 Invalid origin`

### OAuth endpoint'ы

Эти endpoint'ы регистрируются только если соответствующий OAuth provider настроен в конфиге.

- `GET /api/auth/google/login`
- `GET /api/auth/google/callback`
- `GET /api/auth/yandex/login`
- `GET /api/auth/yandex/callback`
- `GET /api/auth/vk/login`
- `GET /api/auth/vk/callback`

Успешный callback:

- выставляет `access_token`, `refresh_token`, `csrf_token`
- перенаправляет пользователя на главную страницу фронтенда из `FRONTEND_ORIGIN`

## Profile API

Контракт страниц:

- `/profile`:
  - обязательно: `GET /api/me`
  - мои события: `GET /api/events?authorId=<me.id>&limit=4&offset=0`
  - избранное (целевая схема): `GET /api/me/favorites?limit=4&offset=0`
- `/profile/settings`:
  - загрузка формы: `GET /api/me` + `GET /api/cities`
  - сохранение: `PATCH /api/me` (json или multipart с `avatar`)
  - выход: `POST /api/auth/logout`
- модалка подписок/подписчиков на `/profile`:
  - список подписчиков: `GET /api/me/followers?limit=100&offset=0`
  - список подписок: `GET /api/me/following?limit=100&offset=0`
  - подписаться: `POST /api/users/{userId}/follow`
  - отписаться: `DELETE /api/users/{userId}/follow`
- карточки событий на `/`, `/events`, `/events/{id}`, `/profile`:
  - поставить в избранное: `POST /api/me/favorites/{eventId}`
  - убрать из избранного: `DELETE /api/me/favorites/{eventId}`

### GET /api/me

Возвращает профиль текущего пользователя.

Требование:

- cookie `access_token`

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "role": "user",
  "birthday": "2004-01-12",
  "bio": "Люблю джаз, выставки и прогулки по городу",
  "interestTagIds": [
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333"
  ],
  "avatarUrl": "http://example.com/uploads/avatars/file.png",
  "city": {
    "id": "uuid",
    "name": "Moscow",
    "countryName": "Russia",
    "timezone": "Europe/Moscow"
  },
  "createdAt": "2026-03-20T10:00:00Z"
}
```

Возможные ошибки:

- `401 Unauthorized`

### POST /api/me/favorites/{eventId}

Добавляет событие в избранное текущего пользователя.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 Event not found`
- `409 Already in favorites`

### DELETE /api/me/favorites/{eventId}

Удаляет событие из избранного текущего пользователя.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 Event not found`

### PATCH /api/me

Частичное обновление профиля текущего пользователя.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Поддерживаемые форматы:

#### 1. application/json

```json
{
  "email": "new-user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "birthday": "2004-01-12",
  "cityId": "11111111-1111-1111-1111-111111111111",
  "bio": "Люблю джаз, выставки и прогулки по городу",
  "interestTagIds": [
    "22222222-2222-2222-2222-222222222222"
  ],
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### 2. multipart/form-data

Поле файла: `avatar`

```text
username=Alice
email=new-user@mail.com
userSurname=Ivanova
birthday=2004-01-12
cityId=11111111-1111-1111-1111-111111111111
bio=Люблю джаз, выставки и прогулки по городу
interestTagIds=22222222-2222-2222-2222-222222222222
interestTagIds=33333333-3333-3333-3333-333333333333
avatar=<binary file>
```

Правила:

- все поля опциональны
- `role` в ответе: `user`, `organizer`, `admin`
- `interestTagIds` передается как массив UUID в JSON или как повторяющееся поле в multipart
- если загружен файл `avatar`, сервер сохраняет его локально
- допустимые форматы файла: `PNG`, `JPEG`, `GIF`, `WebP`
- максимальный размер файла: `5 MB`

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "role": "organizer",
  "birthday": "2004-01-12",
  "bio": "Люблю джаз, выставки и прогулки по городу",
  "interestTagIds": [
    "22222222-2222-2222-2222-222222222222"
  ],
  "avatarUrl": "http://example.com/uploads/avatars/file.png",
  "updatedAt": "2026-03-23T12:00:00Z"
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `403 Invalid origin`

### GET /api/me/favorites

Избранные события текущего пользователя для страницы профиля.

Требование:

- cookie `access_token`

Query параметры:

- `limit` — положительное число, по умолчанию `12`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg",
      "isFavorite": true,
      "tags": [],
      "nextSession": {
        "startAt": "2026-03-30T19:00:00Z",
        "place": {
          "name": "Arena",
          "addressLine": "Lenina 1"
        }
      }
    }
  ],
  "total": 1,
  "limit": 12,
  "offset": 0
}
```

Примечания:

- для текущего пользователя в этом списке `isFavorite` всегда `true`.

Возможные ошибки:

- `401 Unauthorized`

### GET /api/me/followers

Возвращает список подписчиков текущего пользователя.

Требование:

- cookie `access_token`

Query параметры:

- `limit` — положительное число, по умолчанию `20`, максимум `100`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "username": "Maria",
      "userSurname": "Sokolova",
      "avatarUrl": "http://example.com/uploads/avatars/file.png",
      "city": {
        "id": "uuid",
        "name": "Moscow",
        "countryName": "Russia",
        "timezone": "Europe/Moscow"
      },
      "isFollowing": true
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

Возможные ошибки:

- `401 Unauthorized`

### GET /api/me/following

Возвращает список пользователей, на которых подписан текущий пользователь.

Требование:

- cookie `access_token`

Query параметры:

- `limit` — положительное число, по умолчанию `20`, максимум `100`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "username": "Elena",
      "userSurname": "Pavlova",
      "avatarUrl": "http://example.com/uploads/avatars/file.png",
      "city": {
        "id": "uuid",
        "name": "Kazan",
        "countryName": "Russia",
        "timezone": "Europe/Moscow"
      },
      "isFollowing": true
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

Возможные ошибки:

- `401 Unauthorized`

### POST /api/users/{userId}/follow

Подписывает текущего пользователя на пользователя `{userId}`.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 User not found`
- `409 Already following`

### DELETE /api/users/{userId}/follow

Отписывает текущего пользователя от пользователя `{userId}`.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 User not found`

### GET /api/me/collections

Подборки текущего пользователя для профиля.

Требование:

- cookie `access_token`

Query параметры:

- `limit` — положительное число, по умолчанию `12`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Weekend Picks",
      "description": "Best events for weekend",
      "imageUrl": "https://example.com/collection.jpg",
      "isPublic": true
    }
  ],
  "total": 1,
  "limit": 12,
  "offset": 0
}
```

Возможные ошибки:

- `401 Unauthorized`

## Home API

### GET /api/home

Агрегированные данные для главной страницы.

Query параметры:

- `city` — опционально, id или название города для фильтрации главной страницы

Успешный ответ `200 OK`:

```json
{
  "featuredEvents": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "coverImageUrl": "https://example.com/event.jpg",
      "tags": [
        {
          "id": "uuid",
          "name": "Rock",
          "slug": "rock"
        }
      ],
      "nextSession": {
        "startAt": "2026-03-30T19:00:00Z",
        "place": {
          "name": "Arena",
          "addressLine": "Lenina 1"
        }
      }
    }
  ],
  "categories": [
    {
      "id": "uuid",
      "name": "Concert",
      "slug": "concert"
    }
  ],
  "collections": [
    {
      "id": "uuid",
      "title": "Weekend Picks",
      "description": "Best events for weekend",
      "imageUrl": "https://example.com/collection.jpg"
    }
  ]
}
```

## Events API

### GET /api/events

Список мероприятий с фильтрацией.

Query параметры:

- `query`
- `categoryId`
- `tagId`
- `cityId`
- `dateFrom`
- `dateTo`
- `authorId`
- `sort` — одно из `dateAsc`, `dateDesc`, `titleAsc`
- `limit` — положительное число, по умолчанию `12`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg",
      "isFavorite": false,
      "tags": [],
      "nextSession": {
        "startAt": "2026-03-30T19:00:00Z",
        "place": {
          "name": "Arena",
          "addressLine": "Lenina 1"
        }
      }
    }
  ],
  "total": 120,
  "limit": 12,
  "offset": 0
}
```

Примечания:

- `isFavorite` вычисляется относительно текущего авторизованного пользователя;
- для гостя поле может отсутствовать или быть `false`.

Возможные ошибки:

- `400 Validation failed`

### GET /api/events/{eventId}

Полная информация о событии.

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "title": "Rock concert",
  "shortDescription": "Best rock night",
  "fullDescription": "Long description",
  "ageLimit": 18,
  "sourceUrl": "https://example.com",
  "author": {
    "id": "uuid",
    "username": "Alice",
    "avatarUrl": "http://example.com/uploads/avatars/file.png"
  },
  "categories": [],
  "tags": [],
  "images": [
    {
      "id": "uuid",
      "imageUrl": "http://example.com/uploads/events/file.png"
    }
  ],
  "sessions": [],
  "createdAt": "2026-03-20T10:00:00Z",
  "updatedAt": "2026-03-22T10:00:00Z",
  "isFavorite": false,
  "isOwner": true
}
```

Возможные ошибки:

- `404 Event not found`

### POST /api/events

Создание события.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Поддерживаемые форматы:

#### 1. application/json

```json
{
  "title": "Rock concert",
  "shortDescription": "Best rock night",
  "fullDescription": "Long description",
  "ageLimit": 18,
  "sourceUrl": "https://example.com",
  "categoryIds": ["music"],
  "tagIds": ["rock"],
  "imageUrls": ["https://example.com/1.jpg"],
  "sessions": [
    {
      "placeId": "place-1",
      "startAt": "2026-04-20T19:00:00Z",
      "endAt": "2026-04-20T21:00:00Z",
      "price": 1200
    }
  ]
}
```

#### 2. multipart/form-data

Поле файлов: `images`

Поля `categoryIds`, `tagIds`, `imageUrls`, `sessions` нужно передавать как JSON-строки.

```text
title=Rock concert
shortDescription=Best rock night
fullDescription=Long description
categoryIds=["music"]
tagIds=["rock"]
imageUrls=["https://example.com/1.jpg"]
sessions=[{"placeId":"place-1","startAt":"2026-04-20T19:00:00Z","endAt":"2026-04-20T21:00:00Z","price":1200}]
images=<binary file>
images=<binary file>
```

Правила:

- `title`, `shortDescription`, `fullDescription`, `categoryIds`, `sessions` обязательны
- `tagIds` и `imageUrls` могут быть пустыми
- `sourceUrl` опционален
- загруженные файлы сохраняются локально, а их URL автоматически добавляются в `imageUrls`
- допустимые форматы файлов: `PNG`, `JPEG`, `GIF`, `WebP`
- максимальный размер одного файла: `5 MB`

Успешный ответ `201 Created`:

```json
{
  "id": "uuid"
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `403 Invalid origin`

### PATCH /api/events/{eventId}

Частичное обновление события.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Поддерживаемые форматы:

- `application/json`
- `multipart/form-data`

Для `multipart/form-data` файлы передаются в поле `images`, а массивы `categoryIds`, `tagIds`, `imageUrls`, `sessions` должны быть JSON-строками.

Семантика обновления:

- отсутствующее поле не изменяется
- `sourceUrl` можно обновить или очистить
- если в JSON передать `sourceUrl: null`, источник очищается
- `categoryIds`, `tagIds`, `imageUrls`, `sessions` при передаче заменяют соответствующий набор целиком
- пустой массив очищает соответствующий набор
- если переданы новые файлы `images`, они входят в новый набор изображений события вместе с переданными `imageUrls`

Успешный ответ `200 OK`:

- возвращает полный `EventDetails` обновленного события

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 Forbidden`
- `403 CSRF token mismatch`
- `403 Invalid origin`
- `404 Event not found`

### DELETE /api/events/{eventId}

Удаление события.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 Forbidden`
- `403 CSRF token mismatch`
- `403 Invalid origin`
- `404 Event not found`

## Event Invitations API

API для модалки "Пригласить" на странице события и уведомлений-приглашений в шапке.

Связанные таблицы ER:

- `EVENT_INVITATION`
- `EVENT_INVITATION_EVENT`
- `EVENT_INVITATION_SESSION`
- `NOTIFICATION`
- `NOTIFICATION_ACTOR`
- `NOTIFICATION_EVENT`
- `NOTIFICATION_EVENT_SESSION`
- `NOTIFICATION_INVITATION`

Статусы приглашения:

- `pending` — ожидает ответа;
- `accepted` — получатель принял приглашение;
- `declined` — получатель отклонил приглашение;
- `cancelled` — отправитель или система отменили приглашение.

### GET /api/events/{eventId}/invitees/search

Поиск пользователей, которых можно пригласить на событие.

Query параметры:

- `query` — минимум 2 символа
- `limit` — от `5` до `10`, по умолчанию `10`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "username": "Анна",
      "userSurname": "Иванова",
      "avatarUrl": "http://example.com/uploads/avatars/anna.png",
      "city": {
        "id": "uuid",
        "name": "Москва",
        "countryName": "Россия",
        "timezone": "Europe/Moscow"
      },
      "invitationStatus": null
    }
  ]
}
```

Правила:

- backend не возвращает автора события и текущего пользователя;
- если пользователь уже приглашен на это событие, `invitationStatus` содержит текущий статус;
- frontend может использовать endpoint как более точную замену общего `GET /api/search` для модалки приглашения.

Возможные ошибки:

- `400 Validation failed`
- `404 Event not found`

### POST /api/events/{eventId}/invitations

Создает приглашения на событие для одного или нескольких пользователей.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Тело запроса:

```json
{
  "recipientIds": [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222"
  ],
  "message": "Привет! Хочу пригласить тебя на это событие.",
  "eventSessionId": "33333333-3333-3333-3333-333333333333"
}
```

Поля:

- `recipientIds` обязателен, минимум 1 id, максимум 20 id;
- `message` опционален, максимум 500 символов;
- `eventSessionId` опционален, если приглашение относится к конкретному сеансу события.

Успешный ответ `201 Created`:

```json
{
  "items": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "eventSessionId": "uuid",
      "senderId": "uuid",
      "recipientId": "uuid",
      "status": "pending",
      "message": "Привет! Хочу пригласить тебя на это событие.",
      "createdAt": "2026-05-19T12:00:00Z",
      "updatedAt": "2026-05-19T12:00:00Z"
    }
  ]
}
```

Побочные эффекты:

- для каждого получателя создается запись `EVENT_INVITATION`;
- связь с событием пишется в `EVENT_INVITATION_EVENT`;
- если передан `eventSessionId`, связь пишется в `EVENT_INVITATION_SESSION`;
- для каждого получателя создается `NOTIFICATION` типа `event_invitation`;
- notification связывается с actor, event, optional session и invitation через таблицы `NOTIFICATION_*`.

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `403 Invalid origin`
- `404 Event not found`
- `404 Event session not found`
- `409 Invitation already exists`

### PATCH /api/invitations/{invitationId}

Получатель меняет статус приглашения.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Тело запроса:

```json
{
  "status": "accepted"
}
```

Поддерживаемые значения `status`:

- `accepted`
- `declined`

Успешный ответ `200 OK`:

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "eventSessionId": null,
  "senderId": "uuid",
  "recipientId": "uuid",
  "status": "accepted",
  "message": "Привет! Хочу пригласить тебя на это событие.",
  "respondedAt": "2026-05-19T12:10:00Z",
  "updatedAt": "2026-05-19T12:10:00Z"
}
```

Побочные эффекты:

- backend выставляет `respondedAt`;
- если статус `accepted`, отправителю создается уведомление типа `invitation_accepted`;
- если статус `declined`, уведомление отправителю можно не создавать, чтобы не шуметь.

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 Forbidden`
- `403 CSRF token mismatch`
- `404 Invitation not found`
- `409 Invitation is not pending`

## Notifications API

API для колокольчика в шапке.

Связанные таблицы ER:

- `NOTIFICATION`
- `NOTIFICATION_ACTOR`
- `NOTIFICATION_EVENT`
- `NOTIFICATION_EVENT_SESSION`
- `NOTIFICATION_INVITATION`
- `NOTIFICATION_COLLECTION`

Типы уведомлений:

- `event_invitation`
- `invitation_accepted`
- `event_reminder`
- `collection_shared`
- `system`

### GET /api/me/notifications

Возвращает уведомления текущего пользователя.

Требование:

- cookie `access_token`

Query параметры:

- `type` — `all | invitations | system`, по умолчанию `all`
- `unreadOnly` — `true | false`, по умолчанию `false`
- `limit` — положительное число, по умолчанию `20`, максимум `100`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "event_invitation",
      "title": "Анна пригласила вас на концерт",
      "message": "Привет! Хочу пригласить тебя на это событие.",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-05-19T12:00:00Z",
      "actor": {
        "id": "uuid",
        "displayName": "Анна Иванова",
        "avatarUrl": "http://example.com/uploads/avatars/anna.png"
      },
      "event": {
        "id": "uuid",
        "title": "Название мероприятия",
        "coverImageUrl": "http://example.com/uploads/events/event.png",
        "dateText": "19 февраля 2026, 19:00",
        "placeText": "ВДНХ, Москва"
      },
      "eventSession": {
        "id": "uuid",
        "startAt": "2026-02-19T16:00:00Z",
        "endAt": "2026-02-19T18:00:00Z"
      },
      "invitation": {
        "id": "uuid",
        "status": "pending"
      },
      "collection": null
    }
  ],
  "unreadCount": 5,
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

Правила формирования:

- `title`, `message`, `dateText`, `placeText` могут быть вычислены backend'ом из связанных таблиц;
- для `type=invitations` backend возвращает `event_invitation` и `invitation_accepted`;
- для `type=system` backend возвращает `system`, `event_reminder`, `collection_shared`;
- если связанная сущность удалена, notification можно вернуть с `event: null` или скрыть из выдачи.

Возможные ошибки:

- `401 Unauthorized`

### GET /api/me/notifications/events

События, на которые текущий пользователь получил приглашение. Используется в профиле для блока «Иду с друзьями».

Требование:

- cookie `access_token`

Query параметры:

- `status` — опционально: `pending`, `accepted`, `declined`, `cancelled`; для блока «Иду с друзьями» frontend отправляет `accepted`
- `limit` — положительное число, по умолчанию `12`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ `200 OK`:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg",
      "isFavorite": false,
      "invitationStatus": "accepted",
      "invitedBy": {
        "id": "uuid",
        "username": "Alice",
        "displayName": "Alice",
        "avatarUrl": null
      },
      "tags": [],
      "nextSession": {
        "startAt": "2026-03-30T19:00:00Z",
        "place": {
          "name": "Arena",
          "addressLine": "Lenina 1"
        }
      }
    }
  ],
  "total": 1,
  "limit": 12,
  "offset": 0
}
```

Примечания:

- при `status=accepted` backend должен возвращать только принятые приглашения;
- события с `declined`, `pending`, `cancelled` не должны попадать в ответ для `status=accepted`;
- формат элемента такой же, как у карточки события, плюс `invitationStatus` и опциональный `invitedBy`.

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`

### POST /api/me/notifications/{notificationId}/read

Помечает одно уведомление прочитанным.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true,
  "unreadCount": 4
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 Notification not found`

### POST /api/me/notifications/read-all

Помечает все уведомления текущего пользователя прочитанными.

Требования:

- cookie `access_token`
- cookie `csrf_token`
- header `X-CSRF-Token`

Успешный ответ `200 OK`:

```json
{
  "ok": true,
  "unreadCount": 0
}
```

Возможные ошибки:

- `401 Unauthorized`
- `403 CSRF token mismatch`

## Share Links API

API для коротких ссылок и аналитики шаринга событий и подборок.

Связанные таблицы ER:

- `SHARE_LINK`
- `SHARE_LINK_EVENT`
- `SHARE_LINK_COLLECTION`

### POST /api/events/{eventId}/share-links

Создает короткую ссылку на событие.

Требования:

- cookie `csrf_token`
- header `X-CSRF-Token`

Тело запроса:

```json
{
  "source": "event_page"
}
```

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "url": "https://cityhawk.example/s/abc123",
  "token": "abc123",
  "eventId": "uuid",
  "createdAt": "2026-05-19T12:00:00Z"
}
```

Правила:

- если пользователь авторизован, `creatorUserId` заполняется текущим пользователем;
- если пользователь гость, `creatorUserId` может быть `null`;
- `share_token` должен быть уникальным.

Возможные ошибки:

- `400 Validation failed`
- `403 CSRF token mismatch`
- `404 Event not found`

### POST /api/collections/{collectionId}/share-links

Создает короткую ссылку на подборку.

Тело запроса:

```json
{
  "source": "collection_page"
}
```

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "url": "https://cityhawk.example/s/def456",
  "token": "def456",
  "collectionId": "uuid",
  "createdAt": "2026-05-19T12:00:00Z"
}
```

Возможные ошибки:

- `400 Validation failed`
- `403 CSRF token mismatch`
- `404 Collection not found`

### GET /s/{shareToken}

Публичный redirect endpoint для короткой ссылки.

Поведение:

- если token связан с событием, backend отвечает `302 Found` на `/events/{eventId}`;
- если token связан с подборкой, backend отвечает `302 Found` на `/collections/{collectionId}`;
- если token не найден, backend отвечает `404 Not Found`.

## Taxonomy API

### GET /api/categories

Возвращает список категорий.

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Concert",
      "slug": "concert"
    }
  ]
}
```

### GET /api/tags

Возвращает список тегов.

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Rock",
      "slug": "rock"
    }
  ]
}
```

### GET /api/cities

Возвращает список городов.

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Moscow",
      "countryName": "Russia",
      "timezone": "Europe/Moscow"
    }
  ]
}
```

## Search API

### GET /api/search

Подсказки для строки поиска.

Query параметры:

- `query` — минимум 2 символа
- `limit` — от `5` до `10`, по умолчанию `5`

Элемент подсказки может относиться к:

- событию (`type: event`)
- пользователю (`type: user`)
- категории (`type: category`)
- тегу (`type: tag`)

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid-user",
      "type": "user",
      "label": "@anna",
      "title": "Анна Иванова",
      "avatarUrl": "http://example.com/uploads/avatars/anna.png"
    },
    {
      "id": "uuid-event",
      "type": "event",
      "label": "Rock concert"
    },
    {
      "id": "uuid-category",
      "type": "category",
      "label": "Концерты"
    },
    {
      "id": "uuid-tag",
      "type": "tag",
      "label": "Rock"
    }
  ]
}
```

Возможные ошибки:

- `400 Validation failed`

## Collections API

### GET /api/collections

Список публичных подборок.

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Weekend Picks",
      "description": "Best events for weekend",
      "imageUrl": "https://example.com/collection.jpg",
      "isPublic": true
    }
  ]
}
```

### GET /api/collections/{collectionId}

Одна подборка с мероприятиями.

Успешный ответ:

```json
{
  "id": "uuid",
  "title": "Weekend Picks",
  "description": "Best events for weekend",
  "imageUrl": "https://example.com/collection.jpg",
  "isPublic": true,
  "events": []
}
```

Возможные ошибки:

- `404 Collection not found`

## Map API

Правило страницы карты:

- если подборка не выбрана, пины на карте не отображаются
- выбор подборки обязателен для загрузки точек
- фильтры общие и не зависят от конкретной подборки

### GET /api/map/collections

Подборки для боковой панели карты.

Query параметры:

- `cityId` — опционально, фильтр по городу
- `limit` — опционально, ограничение количества

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Городской вайб",
      "description": "Лучшие городские локации",
      "imageUrl": "https://example.com/collection.jpg",
      "eventsCount": 18,
      "isPublic": true
    }
  ]
}
```

### GET /api/map/filters

Глобальные фильтры карты (не зависят от выбранной подборки).

Query параметры:

- `cityId` — опционально

Успешный ответ:

```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "Urban",
      "slug": "urban"
    }
  ],
  "datePresets": [
    {
      "value": "today",
      "label": "Сегодня"
    },
    {
      "value": "weekend",
      "label": "Выходные"
    }
  ],
  "sortOptions": [
    {
      "value": "popular",
      "label": "Сначала популярные"
    },
    {
      "value": "name",
      "label": "По названию А-Я"
    }
  ]
}
```

### GET /api/map/collections/{collectionId}/spots

Пины карты для выбранной подборки.

Query параметры:

- `cityId` — опционально
- `query` — опционально, текстовый поиск
- `tagId` — опционально
- `dateFrom` — опционально
- `dateTo` — опционально
- `sort` — `popular | name | dateAsc | dateDesc`
- `limit` — положительное число, по умолчанию `50`
- `offset` — неотрицательное число, по умолчанию `0`

Успешный ответ:

```json
{
  "collection": {
    "id": "uuid",
    "title": "Городской вайб"
  },
  "items": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "title": "Патриаршие пруды",
      "address": "Малая Бронная улица",
      "latitude": 55.76361,
      "longitude": 37.595164,
      "imageUrl": "https://example.com/photo.jpg",
      "startAt": "2026-05-06T18:00:00Z",
      "popularity": 98,
      "tags": [
        {
          "id": "uuid",
          "name": "Urban",
          "slug": "urban"
        }
      ]
    }
  ],
  "total": 18,
  "limit": 50,
  "offset": 0
}
```

Возможные ошибки:

- `400 Validation failed`
- `404 Collection not found`

## Place Lookup API

Эти endpoint'ы доступны только если в конфиге включен Photon.

### GET /api/place-suggestions

Подсказки мест для создания события.

Query параметры:

- `query` — обязательный
- `limit` — от `1` до `10`, по умолчанию `5`

Успешный ответ:

```json
{
  "items": [
    {
      "token": "opaque-token",
      "label": "ВДНХ, Москва",
      "name": "ВДНХ",
      "addressLine": "Москва, проспект Мира, 119",
      "cityName": "Moscow",
      "countryName": "Russia",
      "timezone": "Europe/Moscow",
      "latitude": 55.8298,
      "longitude": 37.6331,
      "postcode": "129223",
      "district": "Останкинский",
      "source": {
        "provider": "photon",
        "osmId": 123,
        "osmType": "W",
        "osmKey": "tourism",
        "osmValue": "attraction"
      }
    }
  ]
}
```

### POST /api/places/resolve

Преобразует suggestion-token в постоянное место в БД.

Требование:

- cookie `access_token`

Тело запроса:

```json
{
  "token": "opaque-token"
}
```

Успешный ответ:

```json
{
  "id": "place-id",
  "cityId": "city-id",
  "name": "ВДНХ",
  "addressLine": "Москва, проспект Мира, 119",
  "cityName": "Moscow",
  "countryName": "Russia",
  "timezone": "Europe/Moscow",
  "latitude": 55.8298,
  "longitude": 37.6331
}
```

Возможные ошибки:

- `400 Validation failed`
- `400 invalid place suggestion`
- `401 Unauthorized`

## Support API

API техподдержки используется iframe-фронтендом и обычными страницами сервиса. Все endpoint'ы требуют авторизации через cookie `access_token`. Изменяющие запросы дополнительно требуют CSRF:

- cookie `csrf_token`
- header `X-CSRF-Token`

Права доступа:

- `user` создает обращения, видит только свои обращения, редактирует только свои незакрытые обращения и пишет сообщения только в свои обращения;
- `admin` видит все обращения, меняет статус любого обращения, пишет в любую переписку и получает статистику;
- роль хранится в таблице `user_role`, временно меняется вручную через `psql`.

Временно выдать роль администратора можно так:

```sql
INSERT INTO user_role (user_id, role, created_at)
SELECT id, 'admin', now()
FROM user_account
WHERE email = 'admin@mail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Вернуть обычную роль:

```sql
DELETE FROM user_role ur
USING user_account ua
WHERE ur.user_id = ua.id
  AND ua.email = 'admin@mail.com'
  AND ur.role = 'admin';
```

Категории обращений:

- `bug` — баг;
- `suggestion` — предложение;
- `product_complaint` — продуктовая жалоба;
- `other` — другое.

Статусы обращений:

- `open` — открыто;
- `in_progress` — в работе;
- `closed` — закрыто.

### POST /api/support/tickets

Создает обращение текущего пользователя.

Тело запроса:

```json
{
  "category": "bug",
  "title": "Не открывается карточка события",
  "message": "При клике на событие появляется пустой экран."
}
```

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "category": "bug",
  "status": "open",
  "title": "Не открывается карточка события",
  "message": "При клике на событие появляется пустой экран.",
  "createdAt": "2026-04-25T10:00:00Z",
  "updatedAt": "2026-04-25T10:00:00Z",
  "closedAt": null
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`

### GET /api/support/tickets

Возвращает обращения текущего пользователя. Для `admin` возвращает все обращения.

Query параметры:

- `status` — опционально, один из `open`, `in_progress`, `closed`
- `category` — опционально, один из `bug`, `suggestion`, `product_complaint`, `other`
- `limit` — по умолчанию `20`, максимум `100`
- `offset` — по умолчанию `0`

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "category": "bug",
      "status": "open",
      "title": "Не открывается карточка события",
      "message": "При клике на событие появляется пустой экран.",
      "createdAt": "2026-04-25T10:00:00Z",
      "updatedAt": "2026-04-25T10:00:00Z",
      "closedAt": null
    }
  ],
  "limit": 20,
  "offset": 0
}
```

### GET /api/support/tickets/{ticketId}

Возвращает одно обращение текущего пользователя. Для `admin` может вернуть любое обращение.

Возможные ошибки:

- `401 Unauthorized`
- `404 Support ticket not found`

### PATCH /api/support/tickets/{ticketId}

Редактирует обращение текущего пользователя. Закрытые обращения редактировать нельзя.

Тело запроса:

```json
{
  "category": "product_complaint",
  "title": "Некорректная информация о событии",
  "message": "В карточке указано неправильное время начала."
}
```

Все поля опциональны, но должен быть передан хотя бы один параметр.

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 Support ticket not found`
- `409 Support ticket is closed`

### PATCH /api/support/tickets/{ticketId}/status

Меняет статус обращения. Доступно только пользователю с ролью `admin`.

Тело запроса:

```json
{
  "status": "in_progress"
}
```

Правила:

- при статусе `closed` backend выставляет `closedAt`;
- при переходе из `closed` обратно в `open` или `in_progress` backend сбрасывает `closedAt`.

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `403 Forbidden`
- `404 Support ticket not found`

### GET /api/support/tickets/{ticketId}/messages

Возвращает переписку по обращению текущего пользователя. Для `admin` доступна переписка любого обращения.

Успешный ответ:

```json
{
  "items": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "authorUserId": "uuid",
      "authorRole": "user",
      "body": "Проблема повторяется после перезагрузки страницы.",
      "createdAt": "2026-04-25T10:05:00Z"
    }
  ]
}
```

Возможные ошибки:

- `401 Unauthorized`
- `404 Support ticket not found`

### POST /api/support/tickets/{ticketId}/messages

Добавляет сообщение в переписку по обращению. Для `admin` можно добавить сообщение в любое обращение, в ответе `authorRole` будет `admin`.

Тело запроса:

```json
{
  "body": "Проблема повторяется после перезагрузки страницы."
}
```

Успешный ответ `201 Created`:

```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "authorUserId": "uuid",
  "authorRole": "user",
  "body": "Проблема повторяется после перезагрузки страницы.",
  "createdAt": "2026-04-25T10:05:00Z"
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `404 Support ticket not found`

### GET /api/support/stats

Возвращает статистику обращений. Endpoint доступен только пользователю с ролью `admin`.

Query параметры:

- `from` — опционально, RFC3339 timestamp
- `to` — опционально, RFC3339 timestamp

Успешный ответ:

```json
{
  "total": 42,
  "byStatus": {
    "open": 10,
    "in_progress": 12,
    "closed": 20
  },
  "byCategory": {
    "bug": 18,
    "suggestion": 8,
    "product_complaint": 12,
    "other": 4
  },
  "openTotal": 10,
  "inProgressTotal": 12,
  "closedTotal": 20
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`

## Актуальный frontend-набор

Endpoint'ы, которые реально используются текущим frontend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `PATCH /api/me` (`application/json` и `multipart/form-data`)
- `GET /api/me/favorites`
- `POST /api/me/favorites/{eventId}`
- `DELETE /api/me/favorites/{eventId}`
- `GET /api/me/followers`
- `GET /api/me/following`
- `GET /api/me/notifications/events`
- `POST /api/users/{userId}/follow`
- `DELETE /api/users/{userId}/follow`
- `GET /api/home`
- `GET /api/events`
- `GET /api/events/{eventId}`
- `POST /api/events`
- `PATCH /api/events/{eventId}`
- `DELETE /api/events/{eventId}`
- `GET /api/categories`
- `GET /api/tags`
- `GET /api/cities`
- `GET /api/search`
- `GET /api/place-suggestions`
- `POST /api/places/resolve`
- `POST /api/support/tickets`
- `GET /api/support/tickets`
- `GET /api/support/tickets/{ticketId}`
- `PATCH /api/support/tickets/{ticketId}`
- `PATCH /api/support/tickets/{ticketId}/status`
- `GET /api/support/tickets/{ticketId}/messages`
- `POST /api/support/tickets/{ticketId}/messages`
- `GET /api/support/stats`

Профиль:

- текущая реализация блока "избранное" на `/profile` временно использует `GET /api/events`
- целевой API для профиля: `GET /api/me/favorites` и `GET /api/me/collections`
- кнопка сердца на карточках уже использует `POST/DELETE /api/me/favorites/{eventId}` без перезагрузки страницы

Примечание по карте:

- страница `/events-map` использует Yandex Maps API v3 через `YANDEX_MAPS_API_KEY`
- целевая backend-схема для карты описана в разделе `Map API`

Страница события и шапка используют:

- приглашения:
  - `GET /api/events/{eventId}/invitees/search`
  - `POST /api/events/{eventId}/invitations`
  - `PATCH /api/invitations/{invitationId}`
- уведомления:
  - `GET /api/me/notifications`
  - `POST /api/me/notifications/{notificationId}/read`
  - `POST /api/me/notifications/read-all`
- короткие ссылки:
  - `POST /api/events/{eventId}/share-links`
  - `POST /api/collections/{collectionId}/share-links`
  - `GET /s/{shareToken}`

## Планируемый API-бэклог

Endpoint'ы для следующих итераций (когда избранное/подборки/друзья будут расширяться в профиле):

- `GET /api/me/favorites`
- `GET /api/me/collections`
- `POST /api/me/collections`
- `PATCH /api/me/collections/{collectionId}`
- `DELETE /api/me/collections/{collectionId}`
- `POST /api/me/collections/{collectionId}/events/{eventId}`
- `DELETE /api/me/collections/{collectionId}/events/{eventId}`
