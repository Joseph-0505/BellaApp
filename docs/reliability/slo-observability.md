# SLOs, SLIs, resiliência e observabilidade

Relacionado a KAN-7, KAN-20, KAN-21, KAN-22 e KAN-52.

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

## Estratégias de resiliência aplicadas

| Dependência | Estratégia | Evidência |
|---|---|---|
| Redis/cache | cache-aside, TTL, invalidação por versão e fail-open para o banco | `cache.service.ts` e testes unitários |
| Conexão Redis | timeout de conexão de 5 s e reconexão com espera limitada a 3 s | `lib/redis.ts` |
| Redis/Pub-Sub | publicação best-effort; falha é registrada e não desfaz o agendamento | `domain-event-bus.ts` e teste de falha |
| Notificações | até três tentativas e dead-letter queue | `notification-service/src/queue.ts` |
| Deploy | healthcheck, verificação pós-deploy e rollback do código | `scripts/deploy-remote.sh` |

Não há retry automático de requisições de escrita da API: repetir uma operação
não idempotente pode duplicar dados. O retry fica restrito a conexões e ao
processamento assíncrono, onde há identificador e controle de tentativa.

### Avaliação de circuit breaker

Um circuit breaker explícito não foi adicionado ao cache/Pub-Sub. O cache já falha
aberto, o publisher não bloqueia a operação principal e o cliente Redis reconecta
com backoff limitado; portanto, um breaker duplicaria esses mecanismos neste
estágio. A decisão deve ser revista se a latência de falha do Redis consumir mais
de 10% do orçamento de latência ou se ocorrerem falhas repetidas por mais de cinco
minutos. Para integrações HTTP externas futuras, timeout + circuit breaker passa a
ser o padrão.

## Diagnóstico

1. Capture o `X-Request-Id` da resposta com falha ou lentidão.
2. Procure o identificador nos logs do Nginx e do backend.
3. Para catálogo, filtre `cache.*` e confirme se houve hit, miss ou fail-open.
4. Para notificações, siga `domainEventId` de `domain_event.published` até
   `notification.enqueued_from_domain_event`.
5. Consulte `/api/v1/health`, `docker compose ps` e o tamanho das filas Redis.
6. Se o Redis estiver indisponível, siga o roteiro reproduzível em
   `docs/runbooks/redis-degradation.md`.

