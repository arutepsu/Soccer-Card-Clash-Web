FROM node:20-bookworm AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


# =========================
# Backend build (Java + sbt via coursier, non-interactive)
# =========================
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl bash ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# install coursier launcher (single binary)
RUN curl -fLo /usr/local/bin/cs \
    https://github.com/coursier/launchers/raw/master/cs-x86_64-pc-linux && \
    chmod +x /usr/local/bin/cs

# make cs-installed apps available
ENV PATH="/root/.local/share/coursier/bin:${PATH}"

# install sbt ONLY (no setup)
RUN cs install sbt --only-prebuilt

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/

RUN mkdir -p ./backend/public/web
COPY --from=frontend /app/frontend/dist ./backend/public/web

RUN sbt "backend/stage"
