FROM node:20-bookworm AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl bash ca-certificates && \
    curl -fLo /usr/local/bin/cs https://github.com/coursier/launchers/raw/master/cs-x86_64-pc-linux && \
    chmod +x /usr/local/bin/cs

RUN cs setup --yes && cs install sbt

ENV PATH="/root/.local/share/coursier/bin:${PATH}"

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
