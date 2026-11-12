# Mapa da rubrica — onde está cada evidência

Este índice liga cada item da rubrica final ao material do repositório e a uma
forma rápida de demonstrá-lo. Os caminhos são relativos à raiz do projeto.

Pré-requisito das demonstrações ao vivo: stack no ar com `docker compose up --build -d`.

## Arquitetura de Software

| Item da rubrica | Evidência | Como demonstrar | Cards |
|---|---|---|---|
| Documentação arquitetural: C4, ADRs e Quality Scenarios | [architecture/c4.md](architecture/c4.md), [architecture/adr/README.md](architecture/adr/README.md), [architecture/quality-scenarios.md](architecture/quality-scenarios.md) | Abrir os diagramas Mermaid no GitHub; ADR-0001 explica monólito modular contra microserviços | KAN-1, KAN-2 |
| Estilos e DDD: Context Map, Bounded Contexts, Entities, Value Objects e Aggregates | [architecture/ddd.md](architecture/ddd.md) | Percorrer o Context Map e o modelo do agregado `Appointment` | KAN-2 |
| Integração, APIs e dados: OpenAPI e ADR do banco | `backend/openapi/openapi.yaml`, [architecture/adr/0002-mysql-prisma-multiclinica.md](architecture/adr/0002-mysql-prisma-multiclinica.md), [api-validation.md](api-validation.md) | Abrir `https://bellaapp.local/docs/`, fazer login e usar **Authorize** | KAN-6, KAN-54 |
| Qualidade, resiliência e observabilidade: SLOs/SLIs, estratégias e plano de observabilidade | [reliability/slo-observability.md](reliability/slo-observability.md) | Executar `node scripts/validate-redis-degradation.mjs` | KAN-7, KAN-20, KAN-21, KAN-22, KAN-52 |
| Entrega contínua: pipeline, estratégia de deploy e runbook | `.github/workflows/ci-cd.yml`, [deployment-strategy.md](deployment-strategy.md), [runbooks/application-down.md](runbooks/application-down.md), [ci-cd-evidence.md](ci-cd-evidence.md) | Mostrar a aba Actions do GitHub com os jobs verdes | KAN-8 |

## Back-end Avançado

| Item da rubrica | Evidência | Como demonstrar | Cards |
|---|---|---|---|
| Cache distribuído com Redis: cache-aside, TTL e invalidação | `backend/src/shared/cache/cache.service.ts` e `cache.service.spec.ts` | Duas chamadas a `GET /api/v1/services` e `docker compose logs backend` mostrando `cache.miss` e depois `cache.hit` com `LOG_LEVEL=debug` | KAN-50 |
| Mensageria Pub/Sub: publicar e consumir eventos | `backend/src/shared/events/domain-event-bus.ts`, `notification-service/src/domain-events.ts`, [architecture/adr/0005-notificacoes-redis-streams.md](architecture/adr/0005-notificacoes-redis-streams.md) | Criar um agendamento e seguir `domain_event.published`, `domain_event.received` e `notification.enqueued_from_domain_event` nos logs | KAN-51 |
| Docker Compose e Nginx como proxy reverso | `docker-compose.yml`, `nginx/default.conf`, [architecture/adr/0004-docker-compose-nginx.md](architecture/adr/0004-docker-compose-nginx.md) | `docker compose ps` com todos os serviços `healthy`; `http://bellaapp.local` redireciona para HTTPS | KAN-55 |
| Boas práticas: módulos, DTOs, services, controllers, logs e erros | `backend/src/modules/*`, `backend/src/shared/http/error-handler.ts` | Abrir `backend/src/modules/appointments`; enviar login inválido e mostrar `VALIDATION_ERROR` e o header `X-Request-Id` | KAN-53 |

## Tech Forge

| Item da rubrica | Evidência | Como demonstrar | Cards |
|---|---|---|---|
| Gestão do trabalho no Jira | Board do projeto KAN, [jira/status-2026-11-11.md](jira/status-2026-11-11.md), `.husky/commit-msg`, `scripts/validate-jira-references.mjs` | Abrir o board e as duas JQLs de auditoria; mostrar um commit vinculado a um card | KAN-46 |
| Cynefin e escolha da abordagem | [management/cynefin-and-delivery.md](management/cynefin-and-delivery.md) | Explicar por que o domínio é Complexo e a gestão é híbrida | KAN-37, KAN-38, KAN-39 |
| Ciclo de vida: backlog, user stories, critérios de aceite e versões | [product-backlog.md](product-backlog.md), [versioning.md](versioning.md), `CHANGELOG.md` | Mostrar as histórias no Jira e as Releases v1.1.0 a v1.4.0 no GitHub | KAN-40, KAN-43, KAN-44, KAN-45 |

## Validação automatizada

```bash
cd backend && npx jest --config jest.unit.config.cjs --runInBand
cd ../notification-service && npm test
cd .. && npm run test:e2e
```
