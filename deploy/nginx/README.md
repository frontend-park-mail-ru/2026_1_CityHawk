# Статический nginx-сервер CityHawk

`default.conf.template` рассчитан на стандартный механизм шаблонов официального Docker-образа `nginx`:

```text
/etc/nginx/templates/default.conf.template -> /etc/nginx/conf.d/default.conf
```

Шаблоны:

- `default.conf.template` — HTTP-конфиг для локального или внутреннего контура;
- `https.conf.template` — production-конфиг с HTTPS, HTTP/2 и редиректом с HTTP на HTTPS.

Собранный frontend нужно копировать в:

```text
/usr/share/nginx/html
```

Для production-сборки контейнера используйте:

```bash
docker compose -f docker-compose.prod.yml up --build
```

По умолчанию compose использует `default.conf.template`. Для HTTPS:

```bash
NGINX_TEMPLATE=https.conf.template \
SERVER_NAME=cityhawk.example \
SSL_CERTS_DIR=/etc/letsencrypt \
docker compose -f docker-compose.prod.yml up --build
```

Обязательные переменные окружения:

- `BACKEND_UPSTREAM` — host и порт backend, доступные из nginx, например `backend:8080`
- `SERVER_NAME` — имя сервера nginx; для default-сервера можно использовать `_`
- `PUBLIC_API_BASE_URL` — значение, которое попадет во frontend как `window.__APP_CONFIG__.API_BASE_URL`; для same-origin proxy используйте `/api`
- `YANDEX_MAPS_API_KEY` — браузерный ключ Yandex Maps API; может быть пустым

Дополнительные переменные для `https.conf.template`:

- `SSL_CERTIFICATE` — путь к fullchain-сертификату внутри контейнера, например `/etc/letsencrypt/live/cityhawk.example/fullchain.pem`
- `SSL_CERTIFICATE_KEY` — путь к приватному ключу внутри контейнера, например `/etc/letsencrypt/live/cityhawk.example/privkey.pem`

Конфиг:

- раздает SPA из `/usr/share/nginx/html`;
- использует `try_files $uri $uri/ /index.html` для клиентского роутинга;
- проксирует `/api/` и `/uploads/` на `BACKEND_UPSTREAM`;
- динамически отдает `/runtime-config.js` из переменных окружения nginx;
- отключает кэш для `index.html`, `service-worker.js` и `runtime-config.js`;
- включает долгий immutable-кэш для hashed JS/CSS, заранее сжатых `.br`/`.gz` файлов и файлов из `/public/static/`.
- включает `gzip_static on`, чтобы nginx отдавал заранее подготовленные `.gz` файлы.

HTTPS-конфиг дополнительно:

- слушает `443 ssl` и включает `http2 on`;
- редиректит обычный HTTP на HTTPS;
- оставляет `/.well-known/acme-challenge/` на HTTP для выпуска сертификатов Let's Encrypt;
- добавляет базовые security headers, включая `Strict-Transport-Security`.
