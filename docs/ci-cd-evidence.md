# Evidências do pipeline CI/CD

Relacionado a KAN-8 / ARQ-05.

## Etapas versionadas

O arquivo `.github/workflows/ci-cd.yml` identifica:

- rastreabilidade Jira em branch, título do PR e commits;
- build e testes do backend com MySQL efêmero;
- lint, typecheck e build do frontend web;
- lint, typecheck e testes do mobile;
- typecheck, testes e build do serviço de notificações;
- validação e build das imagens do Docker Compose;
- deploy condicional em produção, seguido por healthcheck e rollback de código.

Nenhuma credencial de produção está no workflow. Os valores visíveis de MySQL e
JWT são exclusivos e descartáveis do CI. O deploy usa GitHub Secrets.

## Validação local disponível

```bash
cd backend && npx tsc -p tsconfig.json --noEmit
cd ../Frontend/bellaapp-frontend && npm run lint && npm run typecheck && npm run build
cd ../../mobile && npm run lint && npx tsc --noEmit && npm test
cd ../notification-service && npm run typecheck && npm test && npm run build
cd .. && docker compose config --quiet
```

## Limitações registradas em 09/11/2026

- a execução do workflow só existirá após commit/push para o GitHub;
- deploy depende da configuração do environment `production` e de um host remoto;
- no workspace Windows atual, `npm run build` do backend não sobrescreveu alguns
  arquivos antigos de `backend/dist` por `EPERM`; o typecheck sem emissão passou;
- a API local do Docker não estava acessível para validar o Compose nesta sessão;
- por esses motivos, os cards devem permanecer em revisão até a primeira execução
  verde do GitHub Actions e a demonstração do deploy.
