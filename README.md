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
| redis    | `redis:7-alpine`             | interno (`expose 6379`)           |
| mysql    | `mysql:lts`                 | interno (`expose 3306`)           |

O MySQL permanece isolado na rede `bellaapp-network`. O backend publica a porta 3000
para que o app mobile consiga acessá-lo, enquanto o Nginx encerra o TLS, redireciona
HTTP→HTTPS e faz proxy de `/` para o frontend e de `/api/` para o backend.

### Documentação arquitetural

- [Visão geral e roteiro de apresentação](docs/architecture/README.md)
- [C4 — Contexto, Contêineres e implantação](docs/architecture/c4.md)
- [DDD — Context Map, Bounded Contexts e modelo de domínio](docs/architecture/ddd.md)
- [Architecture Decision Records](docs/architecture/adr/README.md)
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

Acesse: **https://bellaapp.local** (o HTTP em `http://bellaapp.local` redireciona
automaticamente para HTTPS).

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

## Fluxo de branches (GitFlow)

- `main` — produção
- `develop` — integração
- `feature/*` — desenvolvimento de funcionalidades (merge via Pull Request)
