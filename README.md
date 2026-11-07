# SIGE API — Sistema de Informação Gerencial para redes municipais de ensino

API REST (protótipo) em **Java 21 + Spring Boot 4.1 + PostgreSQL**, pensada para rodar em um **Orange Pi Zero 3**
(Docker) na rede local da escola.

## 1. Spring Initializr (https://start.spring.io)

| Campo | Valor |
|---|---|
| Project / Language | Maven / Java |
| Spring Boot | 4.1.x (última estável; a 3.5 saiu do suporte OSS em 30/06/2026) |
| Group / Artifact / Name | `br.edu.sige` / `sige-api` / `sige-api` |
| Package name | `br.edu.sige` |
| Packaging / Java | Jar / **21** |
| Dependencies | Spring Web, Spring Security, Spring Data JPA, Validation, OAuth2 Resource Server, PostgreSQL Driver, Flyway Migration, Spring Boot Actuator, Lombok |

Se o Initializr não incluir `flyway-database-postgresql`, adicione-o (já consta no `pom.xml` deste projeto).

**Swagger/OpenAPI** não está no Initializr: a dependência `org.springdoc:springdoc-openapi-starter-webmvc-ui` (série **3.x**, a que suporta Spring Boot 4) foi adicionada manualmente ao `pom.xml`.

## 2. Executar

Para compilar e iniciar os serviços usando as variáveis de `.env.example`:

```bash
docker compose --env-file .env.example up -d --build
```

Para parar e remover os containers e a rede do Compose, mantendo os dados:

```bash
docker compose --env-file .env.example down
```

**Desenvolvimento (PC):**
```bash
docker run -d --name sige-db -e POSTGRES_DB=sige -e POSTGRES_USER=sige -e POSTGRES_PASSWORD=sige -p 5432:5432 postgres:16-alpine
export JWT_SECRET="$(openssl rand -base64 48)" ADMIN_EMAIL=admin@escola.local ADMIN_SENHA='trocar-123'
./mvnw spring-boot:run        # ou: mvn spring-boot:run
```

**Orange Pi Zero 3 (Docker):**
```bash
cp .env.example .env && nano .env          # defina POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS, ADMIN_*
docker compose up -d --build               # na primeira vez o build no Pi é lento; alternativa abaixo
# build no PC:  docker buildx build --platform linux/arm64 -t sige-api:latest --load .  &&  docker save sige-api | ssh pi docker load
curl http://IP_DO_PI:8080/actuator/health
```

**Frontend (desenvolvimento):**
```bash
cd frontend
npm install
API_URL=http://localhost:8080 npm run dev
```
O frontend encaminha as chamadas `/api/*` ao backend via proxy Next.js. No Docker Compose, `API_URL` aponta para
`http://api:8080`; em desenvolvimento local, configure-o para o endereço acessível da API. O login usa e-mail e senha,
e o token é validado/restaurado por `GET /api/auth/me`. Listas paginadas são carregadas por todas as páginas da API.

**Swagger UI:** desligado por padrão. Para usar em desenvolvimento: `export SWAGGER_ENABLED=true` e abra `http://localhost:8080/swagger-ui.html` (JSON em `/v3/api-docs`). Faça login em `POST /api/auth/login`, copie o `token` e clique em **Authorize** (cole só o token, sem "Bearer"). Mantenha `false` em produção.

**Testes:** `mvn test` (backend; não precisa de banco) e `cd frontend && npm test` (testes unitários do cliente HTTP/paginação).

## 3. Guia de uso

### Primeiro acesso e configuração

1. Inicie a API e o frontend e abra o endereço do frontend no navegador. No Docker Compose, use o endereço/IP do servidor configurado; em desenvolvimento, normalmente `http://localhost:3000`.
2. Entre com o e-mail e a senha inicial definidos por `ADMIN_EMAIL` e `ADMIN_SENHA`. O primeiro usuário ADMIN é criado automaticamente quando o banco ainda não contém usuários.
3. Como ADMIN, cadastre a escola e o ano letivo em **Escolas** e **Anos letivos**. Cadastre também as disciplinas necessárias.
4. Crie os usuários da equipe em **Usuários**, escolhendo o perfil e, para SECRETARIO/PROFESSOR/LEITOR, a escola correspondente.
5. Cadastre os professores e vincule, quando aplicável, cada professor à conta de usuário com perfil PROFESSOR. Em seguida, cadastre turmas, alunos e matrículas; por fim, associe professores, turmas e disciplinas em **Atribuições**.
6. Cada usuário entra com seu próprio e-mail e senha. Troque a senha inicial pela tela **Perfil > Senha**.

### Rotinas por perfil

- **ADMIN:** configura escolas, anos letivos, contas, disciplinas e cadastros; acompanha auditoria e relatórios.
- **SECRETARIO:** administra os cadastros da sua escola, incluindo professores, turmas, alunos, matrículas e atribuições; consulta prontuários e relatórios.
- **PROFESSOR:** acessa suas turmas e registra frequência e avaliações/notas nas atribuições ativas. Use o registro de frequência em lote para lançar a chamada da turma em uma data.
- **LEITOR:** consulta os dados e relatórios permitidos pelo escopo associado à sua conta; não pode gravar alterações.

### Consultas e problemas comuns

- O **Prontuário** do aluno apresenta a matrícula ativa mais recente, disciplinas, avaliações/notas e frequência. Sem matrícula ativa, não há boletim disponível.
- As listagens podem ter mais de uma página; o frontend carrega todas automaticamente, respeitando o acesso do usuário.
- Se a sessão expirar ou for revogada, entre novamente. Se a API estiver indisponível, confirme que o serviço está ativo e que `API_URL` aponta para o endereço correto; os dados não são simulados nem gravados offline.
- A API retorna **403** quando o perfil não tem permissão ou quando o registro está fora do seu escopo; **409** geralmente indica duplicidade ou vínculo que impede a exclusão.

## 4. Autenticação

```bash
curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' \
     -d '{"email":"admin@escola.local","senha":"trocar-123"}'
# -> {"token":"...","tipo":"Bearer","expiraEm":"...","usuario":{...}}
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me
```
JWT HS256 com claims `sub` (id), `email`, `perfil`, `escolaId` e `authorities` (ex.: `["ROLE_PROFESSOR"]`).

Erros seguem um único formato (`timestamp, status, error, message, path, campos`):
400 campos inválidos/ausentes (`campos` lista quais) · 401 credenciais ou token inválidos/revogados · 403 usuário
desativado ou sem permissão/escopo · 404 · 409 duplicidade/vínculos · 422 regra de negócio · 429 excesso de
tentativas de login (cabeçalho `Retry-After`).

**Proteções adicionais da autenticação**
- **Revogação de tokens:** a cada requisição o token é conferido contra o usuário (ativo + `versao_token`). Desativar,
  excluir, trocar senha, perfil ou escola invalida na hora todos os tokens já emitidos (1 consulta por chave primária,
  sem cache, sem janela de inconsistência).
- **Limite de tentativas:** 5 falhas por (IP + e-mail) e 30 por IP em 10 min → 429. Em memória, configurável em
  `app.login-limit.*`. Atrás do proxy HTTPS, habilite `REMOTE_IP_HEADER`/`TRUSTED_PROXIES` para enxergar o IP real.
- **Troca da própria senha:** `PUT /api/auth/alterar-senha` (`senhaAtual`, `novaSenha`); revoga os tokens antigos
  e devolve um token novo. Política: 8 a 72 bytes.

**Auditoria:** todas as entidades guardam `criado_em/atualizado_em/criado_por/atualizado_por`. Além disso, alterações
em notas, frequências, avaliações e contas de usuário geram um evento na tabela `auditoria_eventos` (mesma transação
da alteração), consultável por ADMIN em `GET /api/auditoria?entidade=NOTA&entidadeId=10`.

**Boletim do aluno:** `GET /api/relatorios/alunos/{alunoId}` retorna dados da matrícula ativa mais recente, disciplinas,
avaliações/notas e resumo de frequência, respeitando o escopo do perfil autenticado.

## 5. Matriz de permissões (RBAC)

CRUD = criar/ler/atualizar/excluir · R = leitura · U = só atualização (alteração excepcional)

| Módulo (`/api/...`) | ADMIN | SECRETARIO | PROFESSOR | LEITOR |
|---|---|---|---|---|
| `usuarios`, `perfis` | CRUD (perfis: R) | R | — | — |
| `escolas`, `anos-letivos` | CRUD | R | R | R |
| `disciplinas` | CRUD | CRUD | R | R |
| `professores` | CRUD | CRUD (sua escola) | — | R |
| `turmas` | CRUD | CRUD (sua escola) | R (só as suas) | R |
| `alunos` | CRUD | CRUD | R (sem CPF) | R (sem CPF) |
| `matriculas` | CRUD | CRUD (sua escola) | — (`GET /turmas/{id}/alunos`) | R |
| `atribuicoes` | CRUD | CRUD (sua escola) | `GET /atribuicoes/minhas` | R |
| `frequencias` (+ `/lote`) | CRUD | U (sua escola) | CRUD (suas turmas) | R |
| `avaliacoes`, `notas` | CRUD | U (sua escola) | CRUD (suas atribuições) | R |
| `relatorios` | rede | sua escola | suas turmas | rede (ou escola, se vinculado) |

Camadas de defesa: (1) `SecurityConfig` — qualquer `POST/PUT/PATCH/DELETE` de LEITOR devolve **403** antes de chegar
ao controller; (2) `@PreAuthorize` nos controllers e nos services; (3) `AcessoService` — escopo de dados
(escola do SECRETARIO e atribuição docente **ativa** do PROFESSOR, nunca confiando em IDs do payload).

## 6. Decisões e desvios em relação ao modelo original

1. **Extensões mínimas no banco** (migração `V1`): `usuarios.escola_id` (escola do SECRETARIO/LEITOR),
   `professores.usuario_id` (liga o login do professor às suas atribuições) e `atribuicoes_docentes.ativo`
   (o requisito fala em atribuição "ativa").
2. **Perfis são somente leitura**: as regras estão no código (`hasRole`), então um perfil novo criado via API
   não teria efeito algum.
3. **Login**: a senha é conferida *antes* de informar "usuário desativado" (evita revelar o estado de contas a quem
   não conhece a credencial). Campos ausentes → 400 com a lista; credenciais inválidas → 401; inativo → 403.
4. **Edge computing**: listas sempre paginadas (máx. 100/página), `open-in-view=false`, associações `LAZY` com
   `@EntityGraph` nas consultas de listagem, pool Hikari de 5 conexões, Tomcat com 20 threads, JVM com GC serial e
   heap de 256 MB, PostgreSQL ajustado e sem porta publicada.
5. **Chamada em lote** (`POST /api/frequencias/lote`): uma requisição por turma/dia, ideal para o celular.
6. **LGPD**: CPF só é exposto a ADMIN e SECRETARIO.
7. **Segredos** só por variável de ambiente; o primeiro ADMIN é criado a partir de `ADMIN_EMAIL`/`ADMIN_SENHA`
   apenas se não houver usuários.

## 7. Operação

**HTTPS na rede local (recomendado):** `docker compose --profile https up -d --build` com, no `.env`, `SIGE_HOST`
(nome/IP que os clientes usam), `API_BIND=127.0.0.1`, `REMOTE_IP_HEADER` e `TRUSTED_PROXIES` (linhas já prontas no
`.env.example`). O Caddy emite certificados por uma CA local; instale o certificado raiz nos dispositivos:
`docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt`. O frontend também deve ser
servido por HTTPS (senão o navegador bloqueia as chamadas por conteúdo misto).

**Backup:** `scripts/backup.sh` (pg_dump compactado, retenção de 14 dias, permissão restrita). Agende no cron
(`0 2 * * * /caminho/sige-api/scripts/backup.sh`) e copie para outro dispositivo. Restauração (com a API parada):
`gunzip -c backups/ARQUIVO.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.

**Cartão SD:** prefira cartão de alta resistência (high endurance) ou armazenamento USB/SSD para o volume do banco;
os ajustes de checkpoint/WAL do compose reduzem escritas **sem** abrir mão de durabilidade. Nunca desligue `fsync` nem
mova o WAL para tmpfs.

## 8. Limitações conhecidas do protótipo

- Sem refresh token nem "sair de todos os dispositivos" explícito (trocar a senha já revoga todos os tokens).
- Limitador de login em memória: reinicia com a aplicação e não é compartilhado entre instâncias (só há uma).
- Exclusão física continua devolvendo 409 quando há vínculos; desativação lógica existe em usuários, atribuições e
  matrículas (situação). Ampliar para professores/disciplinas é um próximo passo se a escola pedir.
- Sem exportação em PDF (boletim): recomendável gerar no frontend (impressão/CSS) para não pesar a CPU do Orange Pi.
- Um professor pertence a uma única escola (como no modelo de dados original).
