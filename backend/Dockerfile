# Build
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copia os arquivos de configuração do Maven e o código-fonte
COPY pom.xml .
COPY src ./src

# Compila e gera o pacote JAR
RUN mvn clean package -DskipTests

# Imagem final
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o JAR
COPY --from=builder /app/target/*.jar app.jar

# Expõe a porta padrão do Spring
EXPOSE 8080

# Executa a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
