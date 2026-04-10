# Документация API CityHawk

## Общая информация

API приложения CityHawk построено по REST-подходу и использует JSON.

Основные принципы:

- все endpoint'ы backend начинаются с префикса `/api`
- все запросы и ответы используют `application/json`
- авторизация работает через cookie-сессию
- frontend отправляет запросы с `credentials: "include"`
- access token в теле ответа не используется
- все поля в JSON используют `camelCase`
- даты передаются в ISO 8601 UTC-формате, например `2026-03-23T18:00:00Z`
- идентификаторы сущностей имеют тип `uuid`

Пример клиентского запроса:

```js
fetch("/api/events", {
  method: "GET",
  credentials: "include",
});
```

## Модель авторизации

- после успешного `POST /api/auth/login` сервер создаёт сессию и устанавливает `HttpOnly` cookie
- frontend не хранит access token и не отправляет `Authorization: Bearer ...`
- защищённые endpoint'ы определяют пользователя по session-cookie
- `POST /api/auth/logout` завершает текущую сессию и инвалидирует cookie
- `POST /api/auth/refresh` может использоваться только для продления cookie-сессии, но не возвращает access token

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

Общие правила:

- `400 Bad Request` — ошибка валидации входных данных
- `401 Unauthorized` — пользователь не авторизован
- `403 Forbidden` — пользователь авторизован, но не имеет доступа к ресурсу
- `404 Not Found` — сущность не найдена
- `409 Conflict` — конфликт уникальности или состояния

## Основные типы данных

### EventCard

Краткая карточка мероприятия для списков, главной страницы и подборок.

```json
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
```

Примечания:

- `coverImageUrl` — вычисляемое поле, обычно основное изображение мероприятия из таблицы изображений
- `nextSession` — вычисляемое поле, ближайшая будущая сессия мероприятия
- `tags` — сокращённый набор тегов для отображения на карточке
- карточка содержит только поля, необходимые для списка: название, картинку, теги, ближайшую дату и место

### EventDetails

Полная информация о мероприятии.

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
          "countryName": "Russia",
          "timezone": "Europe/Moscow"
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

Примечания:

- `isFavorite` — вычисляемое поле для текущего пользователя
- `isOwner` — вычисляемое поле, `true`, если текущий пользователь является автором мероприятия
- `shortDescription` в полной сущности используется как описание местоположения (`locationDescription`)

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

### Правила

- `email`, `username`, `userSurname`, `password`, `birthday`, `cityId` обязательны
- `password` передаётся только во входном запросе; в БД хранится `passwordHash`

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

Авторизация пользователя и создание session-cookie.

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

### Примечания

- сервер устанавливает `HttpOnly` cookie с данными сессии
- access token в JSON-ответе не возвращается

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

Продление текущей cookie-сессии.

### Успешный ответ

```json
{
  "ok": true
}
```

### Ошибка

**401 Unauthorized**

```json
{
  "error": "Session expired"
}
```

---

# Profile API

## GET /api/me

Получение профиля текущего авторизованного пользователя.

### Auth

Требуется session-cookie.

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

Частичное обновление профиля текущего пользователя.

### Auth

Требуется session-cookie.

### Тело запроса

Все поля опциональны.

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

### Возможные ошибки

**400 Bad Request**

```json
{
  "error": "Validation failed"
}
```

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

---

# Home API

## GET /api/home

Загрузка агрегированных данных для главной страницы.

### Успешный ответ

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

### Примечания

- endpoint агрегирует данные из мероприятий, категорий и подборок
- `featuredEvents` используют ту же сокращённую форму события, что и списки мероприятий
- `imageUrl` у подборки может быть вычислен как основное изображение подборки

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
- `sort` — сортировка списка, например `dateAsc`, `dateDesc`, `titleAsc`
- `limit` — количество элементов, по умолчанию `12`
- `offset` — смещение, по умолчанию `0`

Пример:

```text
GET /api/events?query=rock&categoryId=uuid&sort=dateAsc&limit=12&offset=0
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
  "total": 120,
  "limit": 12,
  "offset": 0
}
```

## GET /api/events/:eventId

Получение полной информации о мероприятии.

### Успешный ответ

Ответ соответствует типу `EventDetails`.

### Ошибка

**404 Not Found**

```json
{
  "error": "Event not found"
}
```

## POST /api/events

Создание нового мероприятия.

### Auth

Требуется session-cookie.

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

### Правила

- `title`, `shortDescription`, `fullDescription`, `categoryIds` и `sessions` обязательны
- `shortDescription` используется как описание местоположения (`locationDescription`)
- `sourceUrl` опционален и может использоваться как ссылка на внешний источник события
- событие можно создать полностью вручную, без `sourceUrl`
- если `sourceUrl` передан, backend сохраняет его как ссылку на первоисточник, но не требует обязательного импорта данных по ссылке
- `tagIds` и `imageUrls` могут быть пустыми массивами
- `categoryIds` и `tagIds` полностью описывают связи many-to-many
- каждая запись в `sessions` создаёт отдельную сессию мероприятия

### Успешный ответ

**201 Created**

```json
{
  "id": "uuid"
}
```

### Возможные ошибки

**400 Bad Request**

```json
{
  "error": "Validation failed"
}
```

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

## PATCH /api/events/:eventId

Частичное обновление мероприятия.

### Auth

Требуется session-cookie.

### Тело запроса

Допускает частичное обновление. Можно передавать любое подмножество полей из `POST /api/events`.

### Семантика обновления

- отсутствующее поле не изменяется
- `sourceUrl` можно добавить, изменить или очистить
- `categoryIds`, `tagIds`, `imageUrls`, `sessions` при передаче заменяют соответствующий набор целиком
- пустой массив означает очистку соответствующего набора

### Возможные ошибки

**400 Bad Request**

```json
{
  "error": "Validation failed"
}
```

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**

```json
{
  "error": "Forbidden"
}
```

**404 Not Found**

```json
{
  "error": "Event not found"
}
```

## DELETE /api/events/:eventId

Удаление мероприятия.

### Auth

Требуется session-cookie.

### Успешный ответ

```json
{
  "ok": true
}
```

### Возможные ошибки

**401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**

```json
{
  "error": "Forbidden"
}
```

**404 Not Found**

```json
{
  "error": "Event not found"
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

### Примечание

Для получения мероприятий конкретной категории используется `GET /api/events?categoryId=:categoryId`.

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

## GET /api/search

Поиск по мероприятиям, категориям и тегам.

### Query параметры

- `query` — обязательная поисковая строка

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
  ]
}
```

---

# MVP API для первого релиза

Минимальный набор endpoint'ов, который нужен фронтенду в первую очередь:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
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
