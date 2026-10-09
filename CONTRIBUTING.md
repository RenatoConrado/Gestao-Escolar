# Guia de Contribuição

Siga as diretrizes abaixo para garantir a consistência do código, facilidade de manutenção e integração fluida ao repositório.

## Versões Utilizadas

Para contribuir no ambiente de desenvolvimento local sem divergências de runtime, certifique-se de que seu ambiente atenda às seguintes versões padrão do projeto:

- Docker engine 29.9.0
- Docker Compose 5.6.0
  - JDK 21
  - Spring Boot 4.1.1
  - Noje.js 26.10.0
  - PostgreSQL 16


## Como Executar o Ambiente via Docker Compose

O orquestrador `compose.yaml` é a forma recomendada de subir e testar todos os serviços integrados -- Banco de Dados, API Spring Boot e Frontend Next.js.

Para compilar o backend Java, empacotar o frontend Next.js e inicializar o PostgreSQL com a carga inicial (`database/init.sql`), execute:

```bash
docker compose up --build -d
```

Após a execução, os serviços estarão acessíveis nos seguintes endereços:

- Next.js: `http://localhost:3000`
- Spring Boot: `http://localhost:8080/api`
- PostgreSQL: `localhost:5432` (Usuário: `postgres` | Senha: `postgrespassword`)

### Encerrar os Containers

Para parar a execução e manter os volumes de dados preservados:

```bash
docker compose down
```

Para encerrar e apagar totalmente o banco de dados:

```bash
docker compose down -v
```

## Desenvolvimento Local

Caso queira debugar o backend ou o frontend fora do Docker durante o desenvolvimento:

### Spring Boot

Suba apenas o banco de dados: `docker compose up db -d`, aponte `application.properties` para `localhost:5432`
e execute pela sua IDE ou terminal:

```bash
cd backend
./mvnw spring-boot:run
```

### Next.js

Tenha um Node.js recente instalado e execute no terminal:

```bash
cd frontend
npm install
npm run dev
```
