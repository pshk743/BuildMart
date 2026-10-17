# BuildMart

Два независимых приложения в одном репозитории:

| Часть | Путь | Сборка | Технологии |
|---|---|---|---|
| `backend` | `backend/` | Maven (`pom.xml`) | Java 21, Spring Boot, PostgreSQL, Redis |
| `frontend` | `frontend/` | только Docker/nginx | HTML/CSS/JS |

`pom.xml` нужен **только Java/Maven**. У фронтенда своего `pom.xml` нет.

## Запуск через Docker Compose

Из **корня** репозитория:

```bash
cp .env.example .env
docker compose up --build
```

Сервисы:

| Сервис | URL / порт |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5440 |
| Redis | localhost:6380 |

Остановка:

```bash
docker compose down
```

Сброс данных БД:

```bash
docker compose down -v
```

## Сборка Maven (backend)

```bash
mvn -pl backend -am -DskipTests package
```

JAR: `backend/target/backend.jar`

## Структура

```
BuildMart/
├── pom.xml                 # Maven parent (только backend)
├── docker-compose.yml      # backend + frontend + db + redis
├── .env.example
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── ...                 # статика, без pom.xml
```
