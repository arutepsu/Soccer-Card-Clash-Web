# Frontend build
FROM node:20-bookworm AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Backend build
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/

COPY --from=frontend /app/frontend/dist ./backend/public/web

RUN sbt "backend/stage"


# Runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-build /app/backend/target/universal/stage ./stage

COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080
CMD ["/app/entrypoint.sh"]
