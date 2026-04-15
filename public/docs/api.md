# Документация API CityHawk

## Общая информация

API приложения CityHawk построено по REST-подходу.

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
- возвращает JSON с сообщением об успешном логине

## Profile API

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
  "birthday": "2004-01-12",
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
  "username": "Alice",
  "userSurname": "Ivanova",
  "birthday": "2004-01-12",
  "cityId": "11111111-1111-1111-1111-111111111111",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### 2. multipart/form-data

Поле файла: `avatar`

```text
username=Alice
userSurname=Ivanova
birthday=2004-01-12
cityId=11111111-1111-1111-1111-111111111111
avatar=<binary file>
```

Правила:

- все поля опциональны
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
  "birthday": "2004-01-12",
  "avatarUrl": "http://example.com/uploads/avatars/file.png",
  "updatedAt": "2026-03-23T12:00:00Z"
}
```

Возможные ошибки:

- `400 Validation failed`
- `401 Unauthorized`
- `403 CSRF token mismatch`
- `403 Invalid origin`

## Home API

### GET /api/home

Агрегированные данные для главной страницы.

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

### GET /api/tags/{id}/events

События по конкретному тегу.

Техническое примечание:

- на текущем backend это реализовано через `GET /api/events?tagId={id}`
- URL `GET /api/tags/{id}/events` в этой документации — удобная форма описания этого сценария

Query параметры:

- `limit` — положительное число, по умолчанию `12`
- `offset` — неотрицательное число, по умолчанию `0`
- `query` — опциональный текстовый фильтр
- `dateFrom` — дата начала в формате `YYYY-MM-DD`
- `dateTo` — дата конца в формате `YYYY-MM-DD`
- `sort` — одно из `dateAsc`, `dateDesc`, `titleAsc`

Успешный ответ:

```json
{
  "items": [
    {
      "id": "rock-concert",
      "title": "Рок-концерт",
      "shortDescription": "20 марта, Атмосфера, Москва",
      "coverImageUrl": "https://example.com/rock.jpg",
      "tags": [
        {
          "id": "item",
          "name": "Рок",
          "slug": "item"
        }
      ],
      "nextSession": {
        "startAt": "2026-04-14T19:30:00Z",
        "place": {
          "name": "Атмосфера",
          "addressLine": "Москва, Атмосфера"
        }
      }
    }
  ],
  "total": 1,
  "limit": 12,
  "offset": 0
}
```

## Search API

### GET /api/search

Подсказки для строки поиска.

Query параметры:

- `query` — минимум 2 символа
- `limit` — от `5` до `10`, по умолчанию `5`

Успешный ответ:

```json
{
  "items": ["Rock concert", "rock", "retro"]
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

## Минимальный frontend-набор

Endpoint'ы, которые чаще всего нужны фронтенду:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `PATCH /api/me`
- `GET /api/home`
- `GET /api/events`
- `GET /api/events/{eventId}`
- `POST /api/events`
- `PATCH /api/events/{eventId}`
- `DELETE /api/events/{eventId}`
- `GET /api/categories`
- `GET /api/tags`
- `GET /api/search`
- `GET /api/collections`
- `GET /api/collections/{collectionId}`
