# syntax=docker/dockerfile:1
# Build (de preferência no PC):  docker buildx build --platform linux/arm64 -t sige-api:latest --load .
# Orange Pi Zero 3 é ARM64 (Allwinner H618); as imagens base abaixo são multi-arquitetura.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -B dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre
RUN groupadd --system app && useradd --system --gid app --no-create-home app
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER app
EXPOSE 8080

# Ajustes para hardware limitado: GC serial, heap e metaspace limitados, compilação C1 apenas (menos CPU/RAM).
ENV TZ=America/Recife \
    JAVA_OPTS="-XX:+UseSerialGC -Xms64m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError"

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fs http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
