# -----------------------------
# 1) Frontend build
# -----------------------------
FROM node:20-bookworm AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# -----------------------------
# 2) Backend build (WITH sbt)
# -----------------------------
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.2_13_1.10.1_3.3.3 AS backend-build
WORKDIR /app

# Copy sbt build definition first (better Docker layer caching)
COPY build.sbt ./build.sbt
COPY project/ ./project/

# Copy backend sources
COPY backend/ ./backend/

# Copy built frontend into Play public folder
RUN mkdir -p ./backend/public/web
COPY --from=frontend /app/frontend/dist ./backend/public/web

# Build Play staged distribution
RUN sbt "backend/stage"


# -----------------------------
# 3) Runtime image
# -----------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-build /app/backend/target/universal/stage ./stage
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080
CMD ["/app/entrypoint.sh"]
