# 1) Backend build
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.5_11_1.10.5_3.5.2 AS backend-build
WORKDIR /app

COPY build.sbt ./build.sbt
COPY project/ ./project/
COPY backend/ ./backend/
COPY docker/ ./docker/

RUN sbt "backend/stage"

# 2) Runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-build /app/backend/target/universal/stage ./stage
COPY --from=backend-build /app/docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080
CMD ["/app/entrypoint.sh"]
