# Frontend build
FROM node:20-bookworm AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


# Backend build (now includes sbt)
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.4_7_1.10.2_3.3.3 AS backend-build
WORKDIR /app

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/

RUN mkdir -p ./backend/public/web
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
