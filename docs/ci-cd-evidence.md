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

## Execuções no GitHub Actions

Consulta pública em 11/11/2026 em
<https://github.com/Joseph-0505/BellaApp/actions>:

| Run | Evento | Branch | Resultado | Observação |
|---|---|---|---|---|
| #1 | pull_request | `feature/entregas-sprints` | falha | só o job `Jira references` falhou: a branch e o título não tinham chave `KAN-n` |
| #2 | push | `develop` | sucesso | build e testes de backend, web, mobile e notificações, mais build do Compose |
| #3 | pull_request | `develop` → `main` | falha | só o job `Jira references` falhou: PR de promoção sem chave no nome `develop` |
| #4 | push | `main` | sucesso | todos os jobs verdes; deploy pulado porque `DEPLOY_ENABLED` não está ativo |

As duas falhas mostram o controle de rastreabilidade funcionando. A falha do run
#3 era um falso positivo: um PR de promoção agrupa várias histórias. Desde
11/11/2026, `scripts/validate-jira-references.mjs` dispensa a chave no nome e no
título quando a branch de origem é `develop`, e continua validando os commits.

Para reproduzir a regra localmente:

```bash
PR_BRANCH=develop PR_TITLE=Develop PR_BASE_SHA=origin/main node scripts/validate-jira-references.mjs
PR_BRANCH=feature/sem-chave PR_TITLE=Teste PR_BASE_SHA=origin/main node scripts/validate-jira-references.mjs
```

O primeiro comando passa e o segundo falha.

## Limitações atuais

- deploy depende da configuração do environment `production` e de um host remoto,
  que não existem neste projeto acadêmico; o job fica pulado de forma explícita;
- o E2E completo roda no hook `pre-push` contra o stack local com TLS, e não no
  GitHub Actions, porque exige certificado `mkcert` e o host `bellaapp.local`.
