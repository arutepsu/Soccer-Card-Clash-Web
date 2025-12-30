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

# install sbt
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg bash && \
    curl -fsSL https://repo.scala-sbt.org/scalasbt/debian/gpg.key \
      | gpg --dearmor -o /usr/share/keyrings/sbt.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/sbt.gpg] https://repo.scala-sbt.org/scalasbt/debian all main" \
      > /etc/apt/sources.list.d/sbt.list && \
    apt-get update && \
    apt-get install -y sbt && \
    rm -rf /var/lib/apt/lists/*

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/

RUN mkdir -p ./backend/public/web
COPY --from=frontend /app/frontend/dist ./backend/public/web

RUN sbt "backend/stage"

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends bash && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend/target/universal/stage ./stage

COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080

CMD ["/app/entrypoint.sh"]
