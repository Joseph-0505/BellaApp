# BellaApp

Aplicação full-stack (React + Vite no frontend, Fastify + Prisma no backend,
MySQL e Redis)
orquestrada com Docker Compose e servida por Nginx como proxy reverso com HTTPS.

## Arquitetura

| Serviço  | Imagem / Build              | Exposição                         |
|----------|-----------------------------|-----------------------------------|
| nginx    | `nginx:alpine`              | host: 80, 443                       |
| frontend | build de `Frontend/...`     | interno (`expose 4173`)           |
| backend  | build de `backend/`         | host: 3000 (para o app mobile)    |
| notification-service | build de `notification-service/` | host: 3001 em desenvolvimento |
| redis    | `redis:7-alpine`             | interno (`expose 6379`)           |
| mysql    | `mysql:lts`                 | interno (`expose 3306`)           |

O MySQL permanece isolado na rede `bellaapp-network`. O backend publica a porta 3000
para que o app mobile consiga acessá-lo, enquanto o Nginx encerra o TLS, redireciona
HTTP→HTTPS e faz proxy de `/` para o frontend e de `/api/` para o backend.

### Documentação arquitetural

- [Mapa da rubrica: onde está cada evidência](docs/README.md)
- [Visão geral e roteiro de apresentação](docs/architecture/README.md)
- [C4 — Contexto, Contêineres e implantação](docs/architecture/c4.md)
- [DDD — Context Map, Bounded Contexts e modelo de domínio](docs/architecture/ddd.md)
- [Architecture Decision Records](docs/architecture/adr/README.md)
- [Product Backlog com user stories](docs/product-backlog.md)
- [SLOs, resiliência e observabilidade](docs/reliability/slo-observability.md)
- [Cenários de qualidade mensuráveis](docs/architecture/quality-scenarios.md)

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [mkcert](https://github.com/FiloSottile/mkcert) (para o certificado HTTPS local)

## Configuração inicial

### 1. Host customizado

Adicione ao arquivo `hosts` do sistema:

```
127.0.0.1 bellaapp.local
```

- Linux/macOS: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts` (editar como administrador)

### 2. Certificado HTTPS local (mkcert)

```bash
mkcert -install
mkdir -p nginx/certs
mkcert -key-file nginx/certs/bellaapp.local-key.pem \
       -cert-file nginx/certs/bellaapp.local.pem \
       bellaapp.local
```

> Os certificados ficam em `nginx/certs/` e **não são versionados** (estão no
> `.gitignore`). Cada desenvolvedor gera os seus localmente.

### 3. Variáveis de ambiente

Copie os exemplos e preencha os valores:

```bash
cp .env.exemple .env                 # MySQL (raiz) + usuário de teste E2E
cp backend/.env.exemple backend/.env # backend (DATABASE_URL, JWT_SECRET, ...)
```

O Compose usa `MYSQL_ROOT_PASSWORD` e `MYSQL_DATABASE` do `.env` da raiz para montar
automaticamente a `DATABASE_URL` do backend. Assim, o banco sempre é o container
`mysql`, sem dependência de MySQL/XAMPP local. Os arquivos `.env` reais **nunca** são
commitados.

## Subindo a aplicação

```bash
docker compose up --build
```

Isso, do zero:

1. Sobe o MySQL e aguarda ficar saudável (`healthcheck`);
2. Sobe o Redis e aguarda o `PING` responder;
3. Aplica as migrations do Prisma automaticamente (`prisma migrate deploy`);
4. Sobe backend, frontend e Nginx conforme os healthchecks.

Os volumes nomeados `mysql_data`, `redis_data` e `profile_uploads` preservam banco,
cache persistente e uploads entre reinícios. `docker compose down` mantém esses
dados; use `-v` somente quando a remoção for intencional.

Acesse: **https://bellaapp.local** (o HTTP em `http://bellaapp.local` redireciona
automaticamente para HTTPS).

## Documentacao da API

Com o stack no ar, a documentacao OpenAPI navegavel fica disponivel em:

- Swagger UI: **https://bellaapp.local/docs/**
- contrato JSON servido: **https://bellaapp.local/docs/json**
- contrato fonte versionado: `backend/openapi/openapi.yaml`

Para testar endpoints protegidos, execute o login na propria pagina, copie
`data.token`, clique em **Authorize** e informe somente o token. O roteiro completo
de demonstracao esta em `docs/api-validation.md` e a decisao pelo MySQL em
`docs/architecture/adr/0002-mysql-prisma-multiclinica.md`.

## Cache, eventos e observabilidade

O backend usa Redis em dois fluxos independentes:

- cache-aside nas listagens de clientes, serviços, profissionais, salas e
  agendamentos, sempre separado por clínica, escopo de acesso e filtros;
- Pub/Sub no canal `bellaapp:domain-events` para eventos de agendamento,
  pagamento e alterações nos cadastros.

Os catálogos usam TTL de 60 segundos e a agenda usa 20 segundos por padrão.
Mutações incrementam a versão do namespace correspondente, invalidando todas
as combinações de filtros sem executar `KEYS`. Os TTLs podem ser alterados por
`CACHE_DEFAULT_TTL_SECONDS` e `CACHE_APPOINTMENTS_TTL_SECONDS`.

O endpoint `GET /api/v1/health` verifica MySQL e Redis e retorna HTTP 503 se uma
dependência obrigatória estiver indisponível. Os logs incluem `X-Request-Id`,
cache hit/miss/invalidation e publicação/recebimento/processamento de eventos.
Use `LOG_LEVEL=debug` para visualizar hits e misses:

```bash
docker compose logs -f backend
docker compose exec redis redis-cli PUBSUB NUMSUB bellaapp:domain-events
```

## Microservico de notificacoes e fila

O `notification-service` e um processo independente do backend. Ele oferece
`POST /api/v1/notifications` e processa as mensagens de forma assincrona usando
Redis Streams (`bellaapp:notifications`) e um grupo de consumidores. Falhas sao
tentadas novamente ate tres vezes e, depois disso, seguem para a dead-letter
queue `bellaapp:notifications:dead-letter`.

O servico tambem assina `bellaapp:domain-events` e transforma eventos de
agendamento e pagamento em notificacoes. Por padrao a entrega usa logs, sem
enviar dados externamente. O modo SMTP pode ser habilitado pelas variaveis
`NOTIFICATION_SMTP_*` do `.env` raiz.

Exemplo de enfileiramento manual:

```bash
curl -X POST http://localhost:3001/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","recipient":"cliente@example.com","subject":"Agendamento confirmado","message":"Seu horario foi confirmado."}'
```

Para inspecionar a saude e as filas:

```bash
curl http://localhost:3001/health
docker compose exec redis redis-cli XLEN bellaapp:notifications
docker compose exec redis redis-cli XLEN bellaapp:notifications:dead-letter
docker compose logs -f notification-service
```

## Validação do ambiente completo

O mesmo comando `docker compose up --build -d` sobe toda a aplicação. Confirme os
healthchecks e execute os fluxos de login, cadastro de cliente e agenda pelos
testes end-to-end servidos através do Nginx:

```bash
docker compose up --build -d
docker compose ps
npm run test:e2e
```

Os roteiros de cache, indisponibilidade e recuperação ficam em:

- `docs/runbooks/redis-degradation.md`;
- `docs/runbooks/application-down.md`;
- `docs/reliability/slo-observability.md`.

Com o stack ativo, o cenário automatizado de fail-open e recuperação do Redis pode
ser executado por `node scripts/validate-redis-degradation.mjs`.

## Testes end-to-end (Playwright)

Com o stack no ar:

```bash
npm install                  # instala o Husky na raiz
npm run test:e2e             # roda os testes contra https://bellaapp.local
```

O projeto de `setup` do Playwright provisiona o usuário de teste automaticamente
(registro + onboarding, idempotente), então não é preciso popular o banco à mão.

Para rodar contra o dev server do Vite em vez do stack Docker:

```bash
cd Frontend/bellaapp-frontend
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e
```

## Qualidade de código (Husky)

Hooks configurados na raiz (`.husky/`):

- **commit-msg** — valida o formato da mensagem (Conventional Commits)
- **pre-commit** — roda o typecheck do frontend
- **pre-push** — roda os testes end-to-end antes de permitir o push

## Pipeline e operacao

O workflow `.github/workflows/ci-cd.yml` valida backend, frontend, mobile,
notificacoes e as imagens do Docker Compose. O deploy de `main` e opcional e usa
somente variables/secrets do environment `production` do GitHub.

- estrategia e rollback: `docs/deployment-strategy.md`
- runbook de indisponibilidade: `docs/runbooks/application-down.md`
- evidencias e limitacoes: `docs/ci-cd-evidence.md`
- Cynefin, abordagem e papeis: `docs/management/cynefin-and-delivery.md`
- SemVer e releases: `docs/versioning.md`
- historico de mudancas: `CHANGELOG.md`

Branches, titulos de PR e commits devem conter a chave Jira `KAN-n`. Exemplo de
commit: `fix(auth): KAN-53 redireciona sessao expirada`.

## Fluxo de branches (GitFlow)

- `main` — produção
- `develop` — integração
- `feature/*` — desenvolvimento de funcionalidades (merge via Pull Request)
