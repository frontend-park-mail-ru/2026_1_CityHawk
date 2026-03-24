# Документация API CityHawk

## Общая информация

API приложения CityHawk построено по REST-подходу и использует JSON.

Основные принципы:

- все запросы и ответы используют `application/json`
- авторизация работает через cookies
- frontend отправляет запросы с `credentials: "include"`
- все поля в JSON используют `camelCase`
- даты передаются в ISO-формате, например `2026-03-23T18:00:00Z`
- идентификаторы сущностей имеют тип `uuid`

Пример клиентского запроса:

```js
fetch("/api/events", {
  method: "GET",
  credentials: "include",
});
```

## Формат ошибок

При ошибке API возвращает:

```json
{
  "error": "Validation failed",
  "details": {
    "title": "Required"
  }
}
```

---

# Auth API

## POST /api/auth/register

Регистрация нового пользователя.

### Тело запроса

```json
{
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "password": "Secret123!",
  "birthday": "2004-01-12",
  "cityId": "uuid"
}
```

### Успешный ответ

**201 Created**

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

### Возможные ошибки

**400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email"
  }
}
```

**409 Conflict**

```json
{
  "error": "User already exists"
}
```

## POST /api/auth/login

Авторизация пользователя.

### Тело запроса

```json
{
  "email": "user@mail.com",
  "password": "Secret123!"
}
```

### Успешный ответ

**200 OK**

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice"
}
```

### Ошибка

**401 Unauthorized**

```json
{
  "error": "Invalid credentials"
}
```

## POST /api/auth/logout

Завершение текущей сессии.

### Успешный ответ

```json
{
  "ok": true
}
```

## POST /api/auth/refresh

Обновление access token по refresh-cookie.

### Успешный ответ

```json
{
  "accessToken": "jwt-token"
}
```

### Ошибка

**401 Unauthorized**

```json
{
  "error": "Refresh token expired"
}
```

---

# Profile API

## GET /api/me

Получение профиля текущего авторизованного пользователя.

### Успешный ответ

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "birthday": "2004-01-12",
  "avatarUrl": "https://example.com/avatar.jpg",
  "city": {
    "id": "uuid",
    "name": "Moscow",
    "countryName": "Russia",
    "timezone": "Europe/Moscow"
  },
  "createdAt": "2026-03-20T10:00:00Z"
}
```

### Ошибка

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

## PATCH /api/me

Обновление профиля текущего пользователя.

### Тело запроса

```json
{
  "username": "Alice",
  "userSurname": "Ivanova",
  "birthday": "2004-01-12",
  "cityId": "uuid",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Успешный ответ

```json
{
  "id": "uuid",
  "email": "user@mail.com",
  "username": "Alice",
  "userSurname": "Ivanova",
  "birthday": "2004-01-12",
  "avatarUrl": "https://example.com/avatar.jpg",
  "updatedAt": "2026-03-23T12:00:00Z"
}
```

---

# Home API

## GET /api/home

Загрузка данных для главной страницы.

### Успешный ответ

```json
{
  "featuredEvents": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg",
      "category": {
        "id": "uuid",
        "name": "Concert",
        "slug": "concert"
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Rock",
          "slug": "rock"
        }
      ],
      "nextSession": {
        "id": "uuid",
        "startAt": "2026-03-30T19:00:00Z",
        "endAt": "2026-03-30T21:00:00Z",
        "price": 2000,
        "place": {
          "id": "uuid",
          "name": "Arena",
          "addressLine": "Lenina 1",
          "city": {
            "id": "uuid",
            "name": "Moscow"
          }
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

---

# Events API

## GET /api/events

Получение списка мероприятий с фильтрацией.

### Query параметры

- `query` — поисковая строка
- `categoryId` — фильтр по категории
- `tagId` — фильтр по тегу
- `cityId` — фильтр по городу
- `dateFrom` — дата начала диапазона
- `dateTo` — дата конца диапазона
- `authorId` — мероприятия конкретного автора
- `limit` — количество элементов
- `offset` — смещение

Пример:

```text
GET /api/events?query=rock&categoryId=uuid&limit=12&offset=0
```

### Успешный ответ

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg",
      "category": {
        "id": "uuid",
        "name": "Concert",
        "slug": "concert"
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Rock",
          "slug": "rock"
        }
      ],
      "nextSession": {
        "id": "uuid",
        "startAt": "2026-03-30T19:00:00Z",
        "endAt": "2026-03-30T21:00:00Z",
        "price": 2000,
        "place": {
          "id": "uuid",
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

## GET /api/events/:eventId

Получение полной информации о мероприятии.

### Успешный ответ

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
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Concert",
      "slug": "concert"
    }
  ],
  "tags": [
    {
      "id": "uuid",
      "name": "Rock",
      "slug": "rock"
    }
  ],
  "images": [
    {
      "id": "uuid",
      "imageUrl": "https://example.com/event.jpg"
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "startAt": "2026-03-30T19:00:00Z",
      "endAt": "2026-03-30T21:00:00Z",
      "price": 2000,
      "place": {
        "id": "uuid",
        "name": "Arena",
        "addressLine": "Lenina 1",
        "latitude": 55.7,
        "longitude": 37.6,
        "city": {
          "id": "uuid",
          "name": "Moscow",
          "countryName": "Russia"
        }
      }
    }
  ],
  "createdAt": "2026-03-20T10:00:00Z",
  "updatedAt": "2026-03-22T10:00:00Z",
  "isFavorite": false,
  "isOwner": true
}
```

## POST /api/events

Создание нового мероприятия.

### Тело запроса

```json
{
  "title": "Rock concert",
  "shortDescription": "Best rock night",
  "fullDescription": "Long description",
  "ageLimit": 18,
  "sourceUrl": "https://example.com",
  "categoryIds": ["uuid"],
  "tagIds": ["uuid", "uuid"],
  "imageUrls": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  "sessions": [
    {
      "placeId": "uuid",
      "startAt": "2026-03-30T19:00:00Z",
      "endAt": "2026-03-30T21:00:00Z",
      "price": 2000
    }
  ]
}
```

### Успешный ответ

**201 Created**

```json
{
  "id": "uuid"
}
```

## PATCH /api/events/:eventId

Обновление мероприятия.

### Тело запроса

Допускает частичное обновление. Структура аналогична `POST /api/events`.

## DELETE /api/events/:eventId

Удаление мероприятия.

### Успешный ответ

```json
{
  "ok": true
}
```

---

# Categories API

## GET /api/categories

Получение списка категорий.

### Успешный ответ

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

## GET /api/events?categoryId=:categoryId

Получение мероприятий выбранной категории.

Ответ аналогичен `GET /api/events`.

---

# Tags API

## GET /api/tags

Получение списка тегов.

### Успешный ответ

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

---

# Search API

## GET /api/search?query=:query

Поиск по мероприятиям, категориям и тегам.

Пример:

```text
GET /api/search?query=rock
```

### Успешный ответ

```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg"
    }
  ],
  "categories": [
    {
      "id": "uuid",
      "name": "Concert",
      "slug": "concert"
    }
  ],
  "tags": [
    {
      "id": "uuid",
      "name": "Rock",
      "slug": "rock"
    }
  ]
}
```

---

# Collections API

## GET /api/collections

Получение публичных подборок.

### Успешный ответ

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

## GET /api/collections/:collectionId

Получение одной подборки с мероприятиями.

### Успешный ответ

```json
{
  "id": "uuid",
  "title": "Weekend Picks",
  "description": "Best events for weekend",
  "imageUrl": "https://example.com/collection.jpg",
  "isPublic": true,
  "events": [
    {
      "id": "uuid",
      "title": "Rock concert",
      "shortDescription": "Best rock night",
      "coverImageUrl": "https://example.com/event.jpg"
    }
  ]
}
```

---

# MVP API для первого релиза

Минимальный набор endpoint'ов, который нужен фронтенду в первую очередь:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/me`
- `PATCH /api/me`
- `GET /api/home`
- `GET /api/events`
- `GET /api/events/:eventId`
- `POST /api/events`
- `PATCH /api/events/:eventId`
- `DELETE /api/events/:eventId`
- `GET /api/categories`
- `GET /api/tags`
- `GET /api/search?query=...`

