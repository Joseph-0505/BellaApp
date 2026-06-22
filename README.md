# BellaApp

Aplicação full-stack (React + Vite no frontend, Fastify + Prisma no backend, MySQL)
orquestrada com Docker Compose e servida por Nginx como proxy reverso com HTTPS.

## Arquitetura

| Serviço  | Imagem / Build              | Exposição                         |
|----------|-----------------------------|-----------------------------------|
| nginx    | `nginx:alpine`              | **Único exposto ao host**: 80, 443 |
| frontend | build de `Frontend/...`     | interno (`expose 4173`)           |
| backend  | build de `backend/`         | interno (`expose 3000`)           |
| mysql    | `mysql:lts`                 | interno (`expose 3306`)           |

Apenas o Nginx é publicado para fora; os demais serviços só são alcançáveis dentro
da rede `bellaapp-network`. O Nginx encerra o TLS, redireciona HTTP→HTTPS e faz proxy
de `/` para o frontend e de `/api/` para o backend.

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

⚠️ A senha em `backend/.env` (`DATABASE_URL`) **deve ser igual** à
`MYSQL_ROOT_PASSWORD` do `.env` da raiz. Os arquivos `.env` reais **nunca** são
commitados.

## Subindo a aplicação

```bash
docker compose up --build
```

Isso, do zero:

1. Sobe o MySQL e aguarda ficar saudável (`healthcheck`);
2. Aplica as migrations do Prisma automaticamente (`prisma migrate deploy`);
3. Sobe backend, frontend e Nginx.

Acesse: **https://bellaapp.local** (o HTTP em `http://bellaapp.local` redireciona
automaticamente para HTTPS).

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
