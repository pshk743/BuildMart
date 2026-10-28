FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY backend/pom.xml backend/
COPY backend/src backend/src

RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -pl backend -am -DskipTests package \
    || mvn -B -pl backend -am -DskipTests package \
    || mvn -B -pl backend -am -DskipTests package \
    && cp backend/target/backend.jar /app/backend.jar

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/backend.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
