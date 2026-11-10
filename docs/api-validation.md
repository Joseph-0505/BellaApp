# Roteiro de validação da documentação da API

Este roteiro produz evidência reproduzível para KAN-6 e KAN-54.

## Preparação

1. Configure `.env` e `backend/.env` conforme o README.
2. Execute `docker compose up --build`.
3. Aguarde os healthchecks e abra `https://bellaapp.local/docs/`.

O contrato fonte está em `backend/openapi/openapi.yaml`. A representação JSON
servida pela aplicação fica em `https://bellaapp.local/docs/json`.

## Fluxo público

1. Execute `GET /api/v1/health` e confirme HTTP 200 e os estados de MySQL/Redis.
2. Execute `POST /api/v1/auth/login` com um usuário válido.
3. Confira `data.token`, `data.refreshToken`, seus prazos e o usuário retornado.

## Fluxo autenticado pelo Swagger UI

1. Copie somente o valor de `data.token` retornado pelo login.
2. Clique em **Authorize**, cole o token em `bearerAuth` e confirme.
3. Execute `GET /api/v1/users/me` e confirme HTTP 200.
4. Execute uma listagem, por exemplo `GET /api/v1/clients?page=1&limit=10`.
5. Confirme no navegador que a requisição contém `Authorization: Bearer <token>`.

## Contratos e erros

1. Confira os parâmetros, corpos e exemplos de clientes, serviços e agenda.
2. Envie um e-mail inválido no login e confirme HTTP 400 com
   `error.code = VALIDATION_ERROR`.
3. Remova a autorização e execute uma rota protegida; confirme HTTP 401 com
   `error.code = INVALID_TOKEN`.
4. Consulte um UUID inexistente dentro de uma rota de recurso; confirme HTTP 404
   com `error.code = RESOURCE_NOT_FOUND`.

## Verificação automatizada

Dentro de `backend/`, execute:

```bash
npm run build
npx jest --config jest.unit.config.cjs --runInBand --runTestsByPath src/app/openapi.spec.ts
```

O teste confirma que o Swagger UI e o contrato JSON estão publicados e contêm
os principais fluxos da aplicação.
