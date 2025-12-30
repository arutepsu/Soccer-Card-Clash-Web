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
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.5_11_1.10.5_3.5.2 AS backend-build
WORKDIR /app

# ---- GitHub Packages auth for sbt ----
ARG GITHUB_USER
ARG GITHUB_TOKEN
RUN mkdir -p /root/.sbt/1.0 && \
    if [ -n "${GITHUB_USER:-}" ] && [ -n "${GITHUB_TOKEN:-}" ]; then \
      printf 'credentials += Credentials("GitHub Package Registry", "maven.pkg.github.com", "%s", "%s")\n' \
        "$GITHUB_USER" "$GITHUB_TOKEN" \
        > /root/.sbt/1.0/github-packages.sbt ; \
    else \
      echo "WARNING: GITHUB_USER/GITHUB_TOKEN not set; GitHub Packages may fail" ; \
    fi

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/

RUN mkdir -p ./backend/public/web
COPY --from=frontend /app/frontend/dist ./backend/public/web

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
