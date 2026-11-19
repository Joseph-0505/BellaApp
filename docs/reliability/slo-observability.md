# SLOs, SLIs, resiliência e observabilidade

Relacionado a KAN-7, KAN-20, KAN-21, KAN-22 e KAN-52.

Este documento é a fonte única das metas numéricas. Os cenários que provocam e
medem cada meta estão em
[quality-scenarios.md](../architecture/quality-scenarios.md).

## Indicadores e objetivos

Um **SLI** é a medida observada; um **SLO** é a meta acordada para essa medida.
As metas abaixo usam janela móvel de 28 dias e são avaliadas por rota e no agregado.

| SLI | Fórmula | SLO |
|---|---|---|
| Disponibilidade da API | respostas elegíveis que não são 5xx / total de respostas elegíveis | ≥ 99,5% em 28 dias |
| Latência de leitura | percentil 95 da duração de GETs da API | p95 ≤ 400 ms em 28 dias |
| Latência de escrita | percentil 95 da duração de POST/PUT/PATCH/DELETE | p95 ≤ 800 ms em 28 dias |
| Catálogo em cache | `cache.hit / (cache.hit + cache.miss)` para `services` | ≥ 80% após aquecimento |
| Evento consumido | eventos enfileirados pelo assinante / eventos publicados | ≥ 99% em 28 dias |

Respostas 4xx não reduzem a disponibilidade, pois representam requisições
inválidas ou não autorizadas. Timeouts e 5xx contam como indisponibilidade. O SLO
de 99,5% permite até 0,5% de erro, aproximadamente 201,6 minutos em 28 dias.

## Fontes de medição

- logs estruturados do Fastify, correlacionados pelo `X-Request-Id`;
- eventos `cache.hit`, `cache.miss`, `cache.read_failed`, `cache.write_failed` e
  `cache.invalidated` no backend;
- eventos `domain_event.published` e `domain_event.publish_failed` no produtor;
- `notification.enqueued_from_domain_event`, `notification.retry` e dead-letter
  no serviço de notificações;
- healthchecks de backend, frontend, MySQL, Redis e notification-service no
  Docker Compose;
- duração e status das requisições no Nginx/Fastify, agregados em uma plataforma
  de logs na implantação.

Para a apresentação local, `docker compose logs` é a fonte consultável. Em
produção, os mesmos campos devem ser enviados a uma ferramenta centralizada e
agregados por janela de 5 minutos e de 28 dias.

## Plano de observabilidade

O que é coletado, de onde vem, para que serve e qual sinal exige ação.

| Sinal | Tipo | Fonte | Uso | Sinal de alerta |
|---|---|---|---|---|
| `res.statusCode` e `responseTime` do log "request completed" | Log estruturado convertido em métrica | Fastify do backend | SLIs de disponibilidade e latência | taxa de 5xx > 0,5% em 5 min ou p95 de GET > 400 ms |
| `X-Request-Id` | Campo de correlação | Header da resposta e logs do backend | Ligar a reclamação do usuário ao log | não se aplica |
| `cache.hit`, `cache.miss` | Log em nível debug | `CacheService` | SLI de taxa de cache | taxa de hit do catálogo < 80% após aquecimento |
| `cache.read_failed`, `cache.write_failed`, `cache.invalidation_failed` | Log warn | `CacheService` | Detectar operação degradada sem Redis | qualquer ocorrência contínua por mais de 5 min |
| `redis.circuit_open`, `redis.circuit_half_open`, `redis.circuit_closed` | Log warn/info | `CircuitBreaker` | Mostrar quando a API deixou de chamar o Redis e quando voltou | circuito aberto por mais de 5 min |
| `domain_event.published`, `domain_event.publish_failed` | Log info/warn | `DomainEventBus` | SLI de evento consumido | `publish_failed` acima de 1% dos eventos |
| `notification.retry`, `notification.dead_letter` | Log warn/error | Worker do notification-service | Saúde da fila de notificações | qualquer job na dead-letter |
| `queue.queued` e `queue.deadLetter` | Métrica pontual | `GET /health` do notification-service | Backlog e falhas acumuladas | fila crescendo por 3 leituras seguidas |
| `dependencies.mysql` e `dependencies.redis` | Healthcheck | `GET /api/v1/health` do backend | Disponibilidade das dependências | HTTP 503 |
| Estado `healthy` dos contêineres | Healthcheck | Docker Compose | Ordem de subida e reinício | contêiner `unhealthy` |

Logs redigem `Authorization`, cookies e `Set-Cookie` antes de serem gravados.

## Estratégias de resiliência aplicadas

| Dependência | Estratégia | Evidência |
|---|---|---|
| Redis/cache | cache-aside, TTL, invalidação por versão e fail-open para o banco | `cache.service.ts` e testes unitários |
| Conexão Redis | timeout de conexão de 5 s e reconexão com espera limitada a 3 s | `lib/redis.ts` |
| Comandos Redis | timeout de 500 ms por comando durante a requisição e no health check | `lib/redis.ts` e `circuit-breaker.spec.ts` |
| Redis indisponível ou travado | circuit breaker: abre após 3 falhas seguidas, espera 30 s, testa com uma chamada e fecha no sucesso | `shared/resilience/circuit-breaker.ts` e `scripts/validate-redis-degradation.mjs` |
| Redis/Pub-Sub | publicação best-effort; falha é registrada e não desfaz o agendamento | `domain-event-bus.ts` e teste de falha |
| Notificações | até três tentativas e dead-letter queue | `notification-service/src/queue.ts` |
| Deploy | healthcheck, verificação pós-deploy e rollback do código | `scripts/deploy-remote.sh` |

Não há retry automático de requisições de escrita da API: repetir uma operação
não idempotente pode duplicar dados. O retry fica restrito a conexões e ao
processamento assíncrono, onde há identificador e controle de tentativa.

### Circuit breaker do Redis

Todos os comandos que o backend faz ao Redis durante uma requisição passam por
`guardedRedis`, em `lib/redis.ts`. Cache e publicação de eventos usam esse único
ponto, então a proteção vale para os dois.

| Estado | Comportamento |
|---|---|
| Fechado | Comandos executam com limite de 500 ms; 3 falhas seguidas abrem o circuito |
| Aberto | Por 30 s, leituras, escritas de cache e publicações falham na hora e a API segue pelo MySQL |
| Meio-aberto | Uma chamada testa o Redis: sucesso fecha o circuito, falha reabre por mais 30 s |

Duas exceções são intencionais. A **invalidação de cache** sempre tenta, porque
perdê-la serviria dado antigo depois da recuperação; o TTL continua sendo a rede de
segurança. O **health check** fica fora do circuito, com o mesmo limite de 500 ms,
porque precisa informar o estado real do Redis.

A medição de 18/11/2026 mostrou que, sem limite de tempo, um Redis travado deixava a
API sem responder (KAN-80). Os números estão no cenário
[Q-02](../architecture/quality-scenarios.md#q-02--disponibilidade-diante-de-falha-do-cache).
Para integrações HTTP externas futuras, timeout + circuit breaker passa a ser o
padrão.

## Diagnóstico

1. Capture o `X-Request-Id` da resposta com falha ou lentidão.
2. Procure o identificador nos logs do Nginx e do backend.
3. Para catálogo, filtre `cache.*` e confirme se houve hit, miss ou fail-open.
4. Para notificações, siga `domainEventId` de `domain_event.published` até
   `notification.enqueued_from_domain_event`.
5. Consulte `/api/v1/health`, `docker compose ps` e o tamanho das filas Redis.
6. Se o Redis estiver indisponível, siga o roteiro reproduzível em
   `docs/runbooks/redis-degradation.md`.

