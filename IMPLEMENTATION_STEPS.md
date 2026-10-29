# BuildMart: пошаговая реализация бэкенда и интеграции с фронтендом

Стек, выбранный для проекта:

| Компонент | Выбор |
|---|---|
| Язык | Java 21 (LTS) |
| Фреймворк | Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security, Spring Cache) |
| ORM | Hibernate (через Spring Data JPA) |
| СУБД | PostgreSQL 15+ |
| Схема БД | `schema.sql` (создаётся при старте приложения) |
| Кэш | Redis (Spring Cache) |
| Сборка | Maven |
| Аутентификация | JWT (библиотека jjwt), пароли через BCrypt |
| Документация API | springdoc-openapi (Swagger UI) |
| Контейнеры | Docker (multi-stage), Docker Compose |
| Хостинг, облачная БД, хранилище медиа | Выбрать позже (см. шаг 0.2) |

---

## Шаг 0. Подготовка

### 0.1. Установить инструменты

Проверить командами в терминале:

```
java -version        # openjdk 21.x
mvn -v               # Maven 3.9+
docker --version
git --version
```

Установить то, чего нет: JDK 21 (Temurin), Maven 3.9+, Docker Desktop, Git.

### 0.2. Решения, которые можно принять позже

Эти пункты не блокируют разработку. Код делается так, чтобы всё настраивалось через переменные окружения:

- Хостинг: Render или Koyeb.
- Хранилище медиа: Cloudinary или Supabase Storage.
- Облачная PostgreSQL: Neon.tech или Supabase. Выбор влияет только на строку подключения `DB_URL`.

Пока эти решения не приняты, локальная разработка идёт через Docker Compose (шаг 10).

---

## Шаг 1. Git Flow

1. Ветка `master` (или `main`) — стабильная версия. Ветка `develop` создаётся от `master`.
2. Каждая функциональность — отдельная ветка от `develop`:
   - `feature/backend-setup`
   - `feature/auth`
   - `feature/products-catalog`
   - `feature/products-cache`
   - `feature/cart`
   - `feature/docker`
   - `feature/frontend-integration`
3. Коммиты по Conventional Commits:
   - `feat: add JWT authentication`
   - `feat(products): add paginated catalog endpoint`
   - `feat(cache): cache product list in Redis`
   - `fix(cart): prevent quantity above stock`
   - `chore: add docker-compose`
   - `refactor(products): extract specification builder`
4. Слияние фич в `develop` через Pull Request. Релиз: `develop` → `master`, тег `v1.0.0`.

Команды:

```
git checkout master
git checkout -b develop
git push -u origin develop

git checkout develop
git checkout -b feature/auth
# ... работа, коммиты ...
git push -u origin feature/auth
# далее Pull Request в develop
```

---

## Шаг 2. Каркас проекта

Папка `backend/` уже существует, но в ней только пустые каталоги `src/main/java/com/buildingstore/{config,controller,model,repository,service}` и `src/test`. Используем их.

### 2.1. Создать `pom.xml`

Через Spring Initializr (https://start.spring.io) или вручную. Параметры:

- Project: Maven, Language: Java, Spring Boot: последняя стабильная 3.x.
- Group: `com.buildingstore`, Artifact: `backend`, Java: 21.
- Зависимости (starters):
  - `spring-boot-starter-web`
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-security`
  - `spring-boot-starter-validation`
  - `spring-boot-starter-cache`
  - `spring-boot-starter-data-redis`
  - `spring-boot-starter-actuator`
  - `org.postgresql:postgresql` (runtime)
  - `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (версия 0.12.x)
  - `org.springdoc:springdoc-openapi-starter-webmvc-ui` (2.x)
  - Тесты: `spring-boot-starter-test`, `spring-security-test`, `spring-boot-testcontainers`, `testcontainers` (postgresql), если будете использовать интеграционные тесты.

Проверка: `cd backend && mvn -q -DskipTests package` должен собраться.

### 2.2. Структура пакетов

```
backend/src/main/java/com/buildingstore/
  BackendApplication.java
  config/        SecurityConfig, CorsConfig, RedisCacheConfig, OpenApiConfig
  security/      JwtService, JwtAuthenticationFilter, UserDetailsServiceImpl
  controller/    AuthController, ProductController, CartController
  service/       AuthService, ProductService, CartService, PromoService, AdminBootstrap
  repository/    UserRepository, ProductRepository, CartRepository, CartItemRepository, PromoCodeRepository
  model/         User, Role, Product, ProductImage (embeddable), Cart, CartItem, PromoCode
  dto/           запросы и ответы API (record'ы)
  exception/     ApiException, GlobalExceptionHandler, ErrorResponse
backend/src/main/resources/
  application.yml
  schema.sql     схема БД и начальные данные (см. шаг 3)
backend/src/test/java/com/buildingstore/...
```

Правило: контроллеры не работают с entity напрямую, возвращают DTO. Entity не отдаются наружу.

### 2.3. `application.yml` через переменные окружения

Все секреты и адреса берутся из окружения, без значений по умолчанию для паролей и секретов:

```yaml
server:
  port: ${PORT:8080}

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql
  data:
    redis:
      url: ${REDIS_URL:redis://localhost:6379}
  cache:
    type: redis

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-minutes: ${JWT_EXPIRATION_MINUTES:1440}
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5500}
  cache:
    products:
      ttl: ${CACHE_PRODUCTS_TTL:90s}
  admin:
    email: ${ADMIN_EMAIL:}
    password: ${ADMIN_PASSWORD:}

management:
  endpoints:
    web:
      exposure:
        include: health
```

Важно: `open-in-view: false` и `ddl-auto: validate` (схему создаёт `schema.sql`, а не Hibernate; `validate` проверяет, что таблицы соответствуют entity).

### 2.4. Файл `.env.example`

Создать в `backend/` с именами всех переменных (значения-заглушки). Настоящий `.env` уже в `.gitignore`, в git не попадает.

```
DB_URL=jdbc:postgresql://postgres:5432/buildmart
DB_USERNAME=buildmart
DB_PASSWORD=change_me
POSTGRES_DB=buildmart
POSTGRES_USER=buildmart
POSTGRES_PASSWORD=change_me
REDIS_URL=redis://redis:6379
JWT_SECRET=replace_with_at_least_32_random_characters_long_secret
JWT_EXPIRATION_MINUTES=1440
CORS_ALLOWED_ORIGINS=http://localhost:5500
CACHE_PRODUCTS_TTL=90
ADMIN_EMAIL=admin@buildmart.local
ADMIN_PASSWORD=change_me_admin
```

---

## Шаг 3. Схема базы данных (`schema.sql`)

Файл `backend/src/main/resources/schema.sql`. Spring выполняет его при каждом старте приложения (до инициализации Hibernate). Поэтому все команды идемпотентны: `CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`. Таблицы:

1. `users`: `id BIGSERIAL PK`, `email VARCHAR(255) UNIQUE NOT NULL`, `password_hash VARCHAR(100) NOT NULL`, `role VARCHAR(20) NOT NULL` (`CUSTOMER` / `ADMIN`), `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
2. `products`: `id BIGSERIAL PK`, `title VARCHAR(255) NOT NULL`, `description TEXT NOT NULL`, `price NUMERIC(10,2) NOT NULL CHECK (price >= 0)`, `rating DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5)`, `stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0)`, `category VARCHAR(100)`, `specifications JSONB`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
3. `product_images`: `product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE`, `position INTEGER NOT NULL`, `url VARCHAR(1000) NOT NULL`, `PRIMARY KEY (product_id, position)`.
4. `promo_codes`: `id BIGSERIAL PK`, `code VARCHAR(50) UNIQUE NOT NULL`, `discount_percentage INTEGER NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100)`, `is_active BOOLEAN NOT NULL DEFAULT TRUE`.
5. `carts`: `id BIGSERIAL PK`, `user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `promo_code_id BIGINT REFERENCES promo_codes(id)`.
6. `cart_items`: `id BIGSERIAL PK`, `cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE`, `product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE`, `quantity INTEGER NOT NULL CHECK (quantity > 0)`, `UNIQUE (cart_id, product_id)`.

Индексы: по `products(price)`, `products(title)`, `products(rating)`. Для поиска по подстроке (`ILIKE`) по желанию можно добавить `pg_trgm`, но это не обязательно.

В этом же файле в конце вставить промокод (`ON CONFLICT` не даёт создать дубль при каждом старте):

```
INSERT INTO promo_codes (code, discount_percentage, is_active) VALUES ('SAVE10', 10, TRUE) ON CONFLICT (code) DO NOTHING;
```

Ограничение: миграций нет, поэтому изменение существующих таблиц делается вручную (`ALTER TABLE`) или пересозданием локальной БД (`docker compose down -v`). Для учебного проекта это допустимо, но записать в README.

Проверка: при старте приложения `schema.sql` создаёт таблицы, а Hibernate с `validate` не падает.

---

## Шаг 4. Entity и репозитории

1. `User`: поля из таблицы, `role` через `@Enumerated(EnumType.STRING)`.
2. `Product`: `@ElementCollection` на `images` (список `ProductImage` или просто `List<String>`), таблица `product_images`, `@OrderColumn(name = "position")`. Поле `specifications` типа `Map<String, String>` с аннотацией `@JdbcTypeCode(SqlTypes.JSON)`.
3. `Cart`: `@OneToOne` с `User`, `@ManyToOne` с `PromoCode` (nullable), `@OneToMany(mappedBy = "cart", cascade = ALL, orphanRemoval = true)` на `CartItem`.
4. `CartItem`: `@ManyToOne` на `Cart` и на `Product`, поле `quantity`.
5. `PromoCode`: поля из таблицы.
6. Репозитории:
   - `ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product>`.
   - `CartRepository` с методом `Optional<Cart> findByUserId(Long userId)`.
   - `CartItemRepository` с методом `Optional<CartItem> findByIdAndCartId(Long id, Long cartId)` и `Optional<CartItem> findByCartIdAndProductId(...)`.
   - `PromoCodeRepository` с методом `Optional<PromoCode> findByCodeIgnoreCase(String code)`.
   - `UserRepository` с методом `Optional<User> findByEmail(String email)`.

Проверка: написать тест, который сохраняет товар с тремя картинками и читает его обратно.

---

## Шаг 5. Аутентификация и авторизация (JWT, RBAC)

### 5.1. Регистрация и логин

- `POST /api/auth/register`: body `{email, password}`. Валидация: email корректный, пароль от 8 символов. Проверка, что email свободен (иначе 409). Пароль хешируется `BCryptPasswordEncoder`. Роль `CUSTOMER`. Ответ `201` с `{token, user}`.
- `POST /api/auth/login`: body `{email, password}`. Неверные данные → `401`. Ответ `200` с `{token, tokenType: "Bearer", expiresIn, user}`.

### 5.2. Генерация JWT

- `JwtService` через jjwt, алгоритм HS256. Секрет из `JWT_SECRET`, длина не меньше 32 байт (приложение должно падать при старте, если секрет короче).
- В токене: `sub` = id пользователя, `email`, `role`, `exp`.

### 5.3. Фильтр и SecurityFilterChain

- `JwtAuthenticationFilter extends OncePerRequestFilter`: читает заголовок `Authorization: Bearer <token>`, валидирует токен, кладёт `Authentication` в `SecurityContext`.
- `SecurityFilterChain`: stateless (`SessionCreationPolicy.STATELESS`), CSRF выключен (API без cookie).

Правила доступа:

| Маршрут | Доступ |
|---|---|
| `POST /api/auth/**` | всем |
| `GET /api/products/**` | всем |
| `POST/PUT/DELETE /api/products/**` | `ROLE_ADMIN` |
| `/api/cart/**` | любой аутентифицированный |
| `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health` | всем |

- Ответы `401` (нет токена) и `403` (нет прав) в формате JSON, а не HTML-страница по умолчанию.

### 5.4. Администратор

`AdminBootstrap` (`ApplicationRunner`): если заданы `ADMIN_EMAIL` и `ADMIN_PASSWORD` и такого пользователя нет, создаёт его с ролью `ADMIN`. Так есть хотя бы один админ для теста `DELETE /api/products/{id}`.

Проверка: регистрация → логин → запрос с токеном; запрос `POST /api/products` с токеном обычного пользователя возвращает `403`.

---

## Шаг 6. Каталог: `GET /api/products` (поиск, фильтры, сортировка, пагинация в БД)

Главное требование ТЗ: всё делает СУБД. Нельзя вызывать `findAll()` и фильтровать список в памяти.

### 6.1. Параметры запроса

Record `ProductListParams`, принимается через `@ModelAttribute` (или `@RequestParam`):

- `page` (по умолчанию 1, минимум 1)
- `limit` (по умолчанию 12, от 1 до 100)
- `search` (строка, опционально)
- `min_price`, `max_price` (BigDecimal, опционально)
- `min_rating` (double 0–5, опционально)
- `sort_by`: `price` или `title` (если не задано, по `id`)
- `order`: `asc` или `desc` (по умолчанию `asc`)

Некорректные значения (например, `sort_by=foo`, `limit=1000`) → `400`.

### 6.2. Фильтрация через JPA Specification

Строится `Specification<Product>`:

- `search`: поиск без учёта регистра по `title` **или** `description`:
  ```
  lower(title) LIKE '%term%' OR lower(description) LIKE '%term%'
  ```
  Перед этим `term` приводится к нижнему регистру, а символы `%`, `_` и `\` экранируются.
- `min_price`: `price >= min_price`; `max_price`: `price <= max_price`.
- `min_rating`: `rating >= min_rating`.

### 6.3. Сортировка и пагинация

```
Sort sort = order == desc ? Sort.by(field).descending() : Sort.by(field).ascending();
Pageable pageable = PageRequest.of(page - 1, limit, sort);   // Spring считает страницы с 0
Page<Product> result = productRepository.findAll(spec, pageable);
```

Важно: `page - 1`, потому что в API страницы с 1, а в Spring с 0.

### 6.4. Ответ

DTO, точно по формату ТЗ:

```json
{
  "items": [ { "id": 1, "title": "...", "price": 45.99, "rating": 3.5, "images": ["..."], "...": "..." } ],
  "meta": { "total_items": 42, "total_pages": 4, "current_page": 1, "limit": 12 }
}
```

- `total_items` = `result.getTotalElements()`.
- `total_pages` = `result.getTotalPages()`.
- `current_page` = исходный `page`.
- `limit` = исходный `limit`.

### 6.5. Избежать N+1

Коллекция `images` подгружается пакетно: `@BatchSize(size = 50)` на коллекции. Либо отдельный запрос с `JOIN FETCH` для страницы ID. Не делать `FetchType.EAGER` на коллекциях.

Проверка: тест, который вставляет 30 товаров и запрашивает `limit=12&page=3`. Должно вернуться 6 товаров, `total_pages=3`. Включите `spring.jpa.show-sql=true` и убедитесь, что запросов не больше 3 на одну страницу.

---

## Шаг 7. Товары: создание, редактирование, удаление (admin)

Эндпоинты:

- `GET /api/products/{id}`: публичный, нужен для страницы товара. `404`, если нет.
- `POST /api/products` (admin): создание. Валидация: `title` обязателен, `price >= 0`, `stock_quantity >= 0`, `images` минимум 3 элемента, каждый URL валидный (`@Size(min = 3)`, `@NotEmpty`).
- `PUT /api/products/{id}` (admin): полное обновление.
- `DELETE /api/products/{id}` (admin):
  1. В одной транзакции (`@Transactional`) удалить строки `cart_items`, которые ссылаются на товар.
  2. Удалить товар. Строки `product_images` удаляются каскадно (`ON DELETE CASCADE`).
  3. Сбросить кэш каталога (шаг 8).
  4. Ответ `204 No Content`.

Проверка: удалить товар, который лежит в корзине. Ожидаемо: `204`, корзина без этого товара, `404` при повторном запросе.

---

## Шаг 8. Кэширование каталога в Redis

### 8.1. Конфигурация

- `@EnableCaching` в конфиге.
- `RedisCacheManager` с TTL из `app.cache.products-ttl-seconds` (например, 90 секунд). Имя кэша: `productList`.
- Сериализация значений: JSON (`GenericJackson2JsonRedisSerializer`) или `Jackson2JsonRedisSerializer` с конкретным типом. Кэшируется DTO-ответ `{items, meta}`, а не `Page` и не entity.

### 8.2. Ключ кэша строится из query-строки

Метод `ProductListParams.cacheKey()` возвращает строку вида:

```
page=1&limit=12&search=saw&min_price=0&max_price=400&min_rating=0&sort_by=price&order=asc
```

Все параметры включаются всегда (с значениями по умолчанию), чтобы одинаковые запросы давали один ключ.

Аннотация на сервисе:

```java
@Cacheable(cacheNames = "productList", key = "#params.cacheKey()")
public ProductListResponse list(ProductListParams params) { ... }
```

### 8.3. Инвалидация

На методах создания, обновления и удаления товара:

```java
@CacheEvict(cacheNames = "productList", allEntries = true)
```

Это очищает все закэшированные страницы каталога, чтобы клиент сразу видел актуальные данные.

### 8.4. Устойчивость к падению Redis

Настроить `CacheErrorHandler`: при ошибке чтения или записи логировать и продолжать работу. Тогда каталог работает из БД, даже если Redis недоступен.

Проверка:

1. Два одинаковых запроса `GET /api/products?page=1&limit=12`. Во втором в логах SQL запроса нет.
2. `docker compose exec redis redis-cli KEYS "productList*"` показывает ключи.
3. После `POST /api/products` ключи пропали.
4. Через 90 секунд ключ сам исчез (TTL).

---

## Шаг 9. Корзина и промокод

### 9.1. Модель корзины

- Корзина создаётся лениво при первом обращении пользователя, одна на пользователя.
- Итоговая сумма считается в сервисе через `BigDecimal` с округлением `HALF_UP` до 2 знаков:
  - `subtotal` = сумма `price * quantity` по всем позициям;
  - `discount_amount` = `subtotal * discount_percentage / 100`, если промокод применён, иначе 0;
  - `total` = `subtotal - discount_amount`.
- Налог в ТЗ не упоминается. В старом фронтенде был налог 8%. Решение: налог не считаем. Записать в README.

### 9.2. Эндпоинты

- `GET /api/cart`: позиции (`id` позиции корзины, `product_id`, `title`, `price`, `image` (первый URL), `quantity`, `line_total`), `subtotal`, `promo_code`, `discount_percentage`, `discount_amount`, `total`.
- `POST /api/cart/items` с body `{product_id, quantity}` (quantity по умолчанию 1, минимум 1):
  - товар должен существовать (иначе `404`);
  - если позиция уже есть, quantity суммируется;
  - итоговое quantity не больше `stock_quantity`, иначе `409 Conflict` с понятным сообщением;
  - ответ: актуальная корзина.
- `PATCH /api/cart/items/{id}` с body `{quantity}` (минимум 1, те же проверки на склад):
  - позиция должна принадлежать корзине текущего пользователя, иначе `404` (не `403`, чтобы не раскрывать чужие id);
  - ответ: актуальная корзина.
- `DELETE /api/cart/items/{id}`: та же проверка владельца; ответ `204`.
- `POST /api/cart/apply-promo` с body `{code}`:
  - поиск промокода без учёта регистра и только если `is_active = true`;
  - если не найден, `400` или `404` с сообщением «промокод недействителен»;
  - если найден, записать `promo_code_id` в корзину и вернуть актуальную корзину со скидкой.

### 9.3. Пересчёт при изменении

Скидка всегда считается заново из текущих цен и количеств (не хранится как готовая сумма). Тогда при изменении корзины итог остаётся правильным.

Проверка: товар с ценой 100.00, 2 штуки, `SAVE10` → `subtotal = 200.00`, `discount_amount = 20.00`, `total = 180.00`.

---

## Шаг 10. Единый формат ошибок, валидация, Swagger

### 10.1. Ошибки

`@RestControllerAdvice` с обработчиками:

- `MethodArgumentNotValidException` → `400` (поля с ошибками);
- `ConstraintViolationException` → `400`;
- собственное `ApiException(status, message)` → нужный статус;
- `AccessDeniedException` → `403`;
- `AuthenticationException` → `401`;
- всё остальное → `500` с сообщением без стектрейса.

Формат тела единый: `{timestamp, status, error, message, path}`.

### 10.2. Swagger / OpenAPI

- `springdoc-openapi` открывает `/swagger-ui.html` и `/v3/api-docs`.
- В `OpenApiConfig` добавить схему безопасности `bearerAuth` (HTTP, scheme bearer), чтобы в Swagger UI можно было вставить токен кнопкой «Authorize».
- Аннотации `@Operation`, `@Tag`, `@Schema` для основных эндпоинтов (по желанию, но улучшают документацию).

Проверка: открыть `http://localhost:8080/swagger-ui.html`, все эндпоинты видны, `Authorize` работает.

---

## Шаг 11. CORS (для фронтенда прошлого семестра)

- `CorsConfigurationSource` читает список из `CORS_ALLOWED_ORIGINS` (через запятую).
- Разрешены методы `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Разрешены заголовки `Authorization`, `Content-Type`.
- `allowCredentials` не нужен, так как авторизация по заголовку, а не по cookie.
- В переменной должны быть все адреса фронтенда, включая локальный и опубликованный, например:
  `http://localhost:5500,https://<имя>.github.io`.

Проверка: из браузера на `http://localhost:5500` запрос к API не блокируется CORS, в консоли нет ошибок `blocked by CORS policy`.

---

## Шаг 12. Начальные данные (товары)

- Скопировать товары из `frontend/data/products.json` в `backend/src/main/resources/seed/products.json`. Поля `image`/`alt` превратить в массив `images` (минимум 3 элемента на товар). Пока можно повторить один и тот же путь 3 раза, как сейчас делает фронтенд.
- Класс `ProductSeeder` (`ApplicationRunner`): если таблица `products` пуста, читает JSON и сохраняет товары. Идемпотентен: повторный запуск ничего не дублирует.
- После загрузки реальных фото в облачное хранилище (шаг 15) обновить `images` через `PUT /api/products/{id}` или заново прогнать seed на чистой БД.

---

## Шаг 13. Тесты

Минимум:

1. Unit-тесты `CartService`: подсчёт `subtotal`, скидки, округления, проверка склада.
2. `ProductService`: сборка `Specification` и `Pageable` (`page - 1`).
3. Интеграционные тесты на MockMvc:
   - регистрация, логин, неверный пароль → 401;
   - `GET /api/products` возвращает формат с `items` и `meta`;
   - `POST /api/products` без токена → 401, с токеном USER → 403, с токеном ADMIN → 201;
   - корзина: добавление, превышение склада → 409, применение `SAVE10`.
4. Для БД в тестах использовать Testcontainers (PostgreSQL и Redis) или H2 в режиме PostgreSQL. Testcontainers надёжнее, потому что поведение совпадает с продакшеном.

Запуск: `mvn test`.

---

## Шаг 14. Docker

### 14.1. `backend/Dockerfile` (multi-stage)

Стадии:

1. `build`: образ `maven:3.9-eclipse-temurin-21`. Сначала копируется только `pom.xml` и запускается `mvn dependency:go-offline` (кэш слоёв), затем копируется `src` и выполняется `mvn -DskipTests package`.
2. `runtime`: образ `eclipse-temurin:21-jre-alpine`. Копируется только готовый jar из стадии `build`. Создаётся непривилегированный пользователь, затем `USER`. Запуск `ENTRYPOINT ["java", "-jar", "app.jar"]`.

Пример структуры (написать самостоятельно по этой схеме):

```
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Требование ТЗ: `USER` должен быть непривилегированным (в Java-варианте аналог `USER node` — свой пользователь, как выше). Запустить и проверить: `docker exec <container> whoami` → не `root`.

### 14.2. `backend/.dockerignore`

```
target/
.env
.git/
.idea/
*.iml
```

Файл `.env` не должен попадать в образ.

---

## Шаг 15. Docker Compose (локальный запуск)

Файл `docker-compose.yml` в корне репозитория:

- Сервис `app`: `build: ./backend`, `env_file: .env`, внутри сети Docker `DB_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}`, `REDIS_URL=redis://redis:6379`, порт хоста `8080:8080`.
- Сервис `frontend`: `build: ./frontend`, порт хоста `3000:80`.
- Сервис `postgres`: образ `postgres:17-alpine`, порт хоста `5440:5432`, volume `pg_data`.
- Сервис `redis`: образ `redis:7-alpine`, порт хоста `6380:6379`, volume `redis_data`.
- Блок `volumes:` с `pg_data` и `redis_data` в конце файла.

Важно: в `docker-compose.yml` нельзя писать пароли, только ссылки на переменные `${...}`.

Команды:

```
copy .env.example .env        # Windows; на Linux/macOS: cp .env.example .env
# отредактировать .env: придумать пароли и JWT_SECRET
docker compose up --build
```

Проверка:

- `http://localhost:8080/actuator/health` → `{"status":"UP"}`;
- `http://localhost:8080/swagger-ui.html` открывается;
- `GET http://localhost:8080/api/products` возвращает товары;
- после `docker compose down` и `docker compose up` данные сохраняются (volume).

---

## Шаг 16. Интеграция с фронтендом

Фронтенд лежит в `frontend/`. Сейчас он работает на `localStorage` и читает `data/products.json`. Нужно перевести на API.

### 16.1. Адрес API

Создать `frontend/js/config.js`:

```
window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:8080'
};
```

Подключить его в начало всех HTML-страниц до остальных скриптов. Для деплоя поменять значение на адрес Render/Koyeb.

### 16.2. Общий модуль `frontend/js/api.js`

- Функция `apiFetch(path, options)`: добавляет базовый адрес, заголовок `Content-Type: application/json`, и, если есть токен, `Authorization: Bearer <token>`.
- Токен хранить в `localStorage` под ключом `token`.
- При ответе `401` удалить токен и перенаправить на `login.html`.

### 16.3. Авторизация на фронте

- Новые страницы `frontend/login.html` и `frontend/register.html` с формами, стиль как у остальных страниц (`css/style.css`, `css/header.css`, `css/footer.css`).
- Отправка на `POST /api/auth/login` и `POST /api/auth/register`, токен сохраняется, после входа переход на `index.html`.
- В `components/header.html` добавить ссылку «Войти» или «Выйти» в зависимости от наличия токена (логика в `api.js`).

### 16.4. Каталог: `products.js` и `filter.js`

- Удалить клиентскую фильтрацию (`filterProducts` с `this.products.filter(...)`) и сортировку по массиву.
- Загрузка через `GET /api/products` с query-параметрами из формы:
  - поиск: `search`;
  - ползунок цены: `min_price`, `max_price`;
  - рейтинг: `min_rating` (выбранная кнопка «4+ Stars» → 4);
  - сортировка из `<select>`:
    - `Name (A-Z)` → `sort_by=title&order=asc`;
    - `Price (Low to High)` → `sort_by=price&order=asc`;
    - `Price (High to Low)` → `sort_by=price&order=desc`.
- Защита от гонки запросов: сохранять номер запроса и отрисовывать только ответ на последний.
- Максимум цены для ползунка брать из отдельного запроса без фильтров (или из `max` в первом ответе), а не из отфильтрованного списка.
- Кнопка «Add to Cart» вызывает `POST /api/cart/items` с `product_id`. Если пользователь не вошёл, перенаправление на `login.html`.
- Убрать `localStorage.getItem('cart')` и `localStorage.setItem('cart', ...)`.

### 16.5. Страница товара: `product-detail.js`

- Загрузка через `GET /api/products/{id}`, id берётся из `?id=`.
- Галерея использует реальный массив `images` (вместо текущего `[image, image, image]`).
- Спецификации: `specifications` это объект, отрисовать пары ключ/значение.
- Блок «Related Products»: вместо жёстко заданных id 2 и 4 запросить товары той же категории (`GET /api/products?...`, при необходимости добавить параметр `category` в бэкенд, это отдельная задача) или оставить текущую логику, но получать данные из API.
- «Add to Cart»: `POST /api/cart/items` с `product_id` и `quantity` из поля.
- Убрать `localStorage` корзину.

### 16.6. Корзина: `cart.js`

- `GET /api/cart` при загрузке страницы. Пустая корзина: текущая разметка «Your Cart is Empty».
- Изменение количества: `PATCH /api/cart/items/{id}`, где `id` это `item.id` из ответа (не id товара).
- Удаление: `DELETE /api/cart/items/{id}`.
- Промокод: `POST /api/cart/apply-promo` с `{code}`. Скидка и итог берутся из ответа сервера. Удалить захардкоженный список `validCodes` и 8% налога в JS: итоги считает сервер.
- Строка «Tax (8%)» убрать, так как в бэкенде налога нет.
- Если пользователь не вошёл, перенаправить на `login.html`.

### 16.7. Значок корзины: `cart-badge.js`

- Количество берётся из `GET /api/cart` (сумма `quantity` по позициям), а не из `localStorage`.
- Обновлять после добавления, изменения или удаления: вызвать функцию обновления или отправить событие `window.dispatchEvent(new Event('cart:updated'))`, на которое подписан `cart-badge.js`.
- Для гостя значок показывает 0 (без запроса).

### 16.8. Очистка

- `frontend/data/products.json` больше не используется фронтендом. Оставить как исходник для seed (шаг 12) или удалить после переноса.
- Удалить все обращения к `localStorage` для корзины.

### 16.9. Запуск фронтенда

Без Node.js, любой статический сервер. Варианты:

- расширение VS Code **Live Server** (порт 5500 по умолчанию, совпадает с `CORS_ALLOWED_ORIGINS`);
- или Python: `python -m http.server 5500 --directory frontend`.

Открыть `http://localhost:5500`.

Проверка сквозного сценария: регистрация → вход → каталог с фильтрами → страница товара → добавление в корзину → корзина → промокод `SAVE10` → изменение количества → удаление → обновление значка.

---

## Шаг 17. Облачная БД, Redis, хранилище медиа

### 17.1. Облачная PostgreSQL

1. Создать проект в Neon.tech (или Supabase), скопировать строку подключения.
2. Преобразовать в JDBC-формат: `jdbc:postgresql://<host>/<db>?sslmode=require`.
3. Записать `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` в переменные хостинга (не в git).
4. При первом запуске приложения `schema.sql` создаёт таблицы автоматически.

### 17.2. Redis в облаке

Нужен хостинговый Redis (например, Upstash, Redis Cloud или Redis на платформе хостинга, если она его предоставляет). Проверить доступность на выбранной платформе. Адрес записать в `REDIS_URL` (формат `rediss://` для TLS, если провайдер требует).

### 17.3. Медиа

1. Выбрать Cloudinary или Supabase Storage (решение из шага 0.2).
2. Загрузить минимум 3 изображения на каждый товар.
3. Записать URL в `images` через `PUT /api/products/{id}` (или через обновлённый seed).
4. Адреса картинок в `frontend` и в БД должны быть абсолютными URL (`https://...`), иначе на опубликованном фронтенде картинки не откроются.

---

## Шаг 18. Деплой бэкенда (Render или Koyeb)

Общие шаги для обеих платформ:

1. Запушить ветку `master` с `backend/Dockerfile` в GitHub.
2. Создать новый Web Service из репозитория с типом Docker.
3. Root directory: `backend`. Dockerfile: `backend/Dockerfile` (или `Dockerfile` при root = `backend`).
4. Переменные окружения (значения из облачных сервисов, не из `.env` в репозитории):
   `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRATION_MINUTES`, `CORS_ALLOWED_ORIGINS`, `CACHE_PRODUCTS_TTL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. Порт: платформа передаёт `PORT`. Приложение читает его через `server.port: ${PORT:8080}`.
6. Health check: путь `/actuator/health`.
7. Деплой. Проверить:
   - `https://<сервис>.onrender.com/actuator/health` (или домен Koyeb) → `UP`;
   - `https://<сервис>/swagger-ui.html` открывается;
   - `GET /api/products` возвращает данные из облачной БД.

Замечание: на бесплатных тарифах сервис может засыпать, первый запрос будет долгим. Это нормально для учебного проекта, но упомянуть в README.

---

## Шаг 19. README.md

Файл `backend/README.md` (или корневой `README.md`) должен содержать:

1. **Пошаговый локальный запуск**:
   ```
   cp .env.example .env
   docker compose up --build
   ```
   Проверка: `http://localhost:8080/actuator/health`, фронт `http://localhost:3000`.
2. **Список всех переменных окружения** с описанием и примером (таблица из шага 2.4 плюс `PORT`).
3. **Ссылки**:
   - деплой бэкенда: `https://<...>`;
   - интерактивная документация Swagger: `https://<...>/swagger-ui.html`;
   - фронтенд (если опубликован): `https://<...>`.
4. Структура проекта и краткое описание эндпоинтов.
5. Описание решений: налог не считается, пагинация страницами с 1, кэш на 90 секунд, Redis не обязателен для работы каталога (см. шаг 8.4).
6. Порты локально: PostgreSQL `5440`, Redis `6380`, API `8080`, frontend `3000`.

---

## Шаг 20. Финальная проверка по ТЗ

Отметить каждый пункт:

- [ ] Модели: `User`, `Product` (≥ 3 картинок), `Cart`/`CartItem`, `PromoCode`.
- [ ] Регистрация с хешированием BCrypt, логин с JWT в `Authorization: Bearer`.
- [ ] RBAC: customer работает с корзиной, admin управляет товарами.
- [ ] `GET /api/products`: `page`, `limit`, `search` (без учёта регистра), `min_price`, `max_price`, `min_rating`, `sort_by` (`price`/`title`), `order` (`asc`/`desc`), формат ответа `{items, meta}`.
- [ ] Всё фильтруется и пагинируется в БД (нет `findAll()` в памяти).
- [ ] `DELETE /api/products/{id}` только для admin, обрабатывает внешние ключи, сбрасывает кэш.
- [ ] Кэш Redis с ключом из query-строки, TTL 60–120 секунд, инвалидация при create/update/delete.
- [ ] Корзина: `GET`, `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}`.
- [ ] `POST /api/cart/apply-promo`: `SAVE10` → скидка 10%.
- [ ] Dockerfile: multi-stage, непривилегированный пользователь.
- [ ] docker-compose в корне: app, frontend, postgres 17 (порт 5440), redis 7 (порт 6380), именованные volumes, `.env` и `.env.example`.
- [ ] Облачная PostgreSQL, облачное хранилище медиа, деплой из Dockerfile на Render или Koyeb.
- [ ] CORS настроен для фронтенда.
- [ ] Git Flow, Conventional Commits, README с инструкциями, переменными и ссылками.

---

## Порядок работы (кратко)

| # | Что делаем | Результат |
|---|---|---|
| 0 | Инструменты, решения | Окружение готово |
| 1 | Git Flow, ветки | `develop` и feature-ветки |
| 2 | Каркас Spring Boot | `mvn package` собирается |
| 3 | `schema.sql` | Таблицы созданы |
| 4 | Entity и репозитории | Тест сохранения проходит |
| 5 | JWT, регистрация, логин, роли | Auth работает |
| 6 | Каталог с фильтрами и пагинацией | `GET /api/products` по ТЗ |
| 7 | CRUD товаров (admin) | Create/update/delete работают |
| 8 | Redis-кэш и инвалидация | Кэш подтверждён через redis-cli |
| 9 | Корзина и промокод | Итоги со скидкой верны |
| 10 | Ошибки, валидация, Swagger | `/swagger-ui.html` работает |
| 11 | CORS | Фронтенд ходит в API без ошибок |
| 12 | Seed товаров | В каталоге есть товары |
| 13 | Тесты | `mvn test` зелёный |
| 14 | Dockerfile | Образ собирается, запуск от непривилегированного |
| 15 | docker-compose | `docker compose up --build` работает |
| 16 | Интеграция фронтенда | Сквозной сценарий проходит |
| 17 | Облачные БД, Redis, медиа | Внешние сервисы подключены |
| 18 | Деплой на Render/Koyeb | Публичный URL работает |
| 19 | README | Инструкции, env, ссылки |
| 20 | Финальная проверка | Все пункты ТЗ отмечены |
