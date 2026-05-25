FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM gradle:8.14-jdk17-alpine AS backend
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./
COPY src ./src
COPY --from=frontend /app/frontend/dist ./frontend/dist
RUN chmod +x ./gradlew
RUN ./gradlew bootJar -PskipFrontendBuild -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
ENV SPRING_PROFILES_ACTIVE=prod
COPY --from=backend /app/build/libs/*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 8081
ENTRYPOINT ["/app/docker-entrypoint.sh"]
