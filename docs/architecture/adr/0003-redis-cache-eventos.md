# ADR-0003 — Usar Redis para cache distribuído e eventos em tempo real

- **Status:** Aceita
- **Data:** 05/11/2026
- **Decisores:** equipe BellaApp

## Contexto

Listagens de agenda e catálogos são consultadas repetidamente. Mais de uma
instância do backend deve observar o mesmo cache e mutações precisam ser
visíveis rapidamente. O projeto também precisa publicar eventos de negócio e
comprovar seu consumo sem introduzir um broker adicional.

## Direcionadores

- cache compartilhado entre processos;
- TTL e invalidação previsíveis;
- isolamento por clínica e papel;
- baixa complexidade no Docker Compose;
- circulação de eventos observável e correlacionável;
- falha de cache/evento não deve desfazer mutação já persistida.

## Alternativas consideradas

### Cache em memória do processo

Seria simples, mas cada réplica teria conteúdo diferente e a invalidação não se
propagaria entre instâncias.

### Consultar sempre o MySQL

Evitaria consistência eventual do cache, porém repetiria consultas e não
atenderia ao requisito de cache distribuído.

### RabbitMQ, Kafka ou Redis Streams

Forneceriam recursos de durabilidade, reprocessamento e grupos de consumidores.
São escolhas melhores quando perda de evento não é aceitável, mas adicionariam
infraestrutura e operação além do requisito atual de circulação em tempo real.

## Decisão

Usar uma única implantação Redis com dois fluxos independentes:

1. **Cache-aside**: chave composta por versão, namespace, clínica, escopo de
   acesso e hash canônico dos filtros. Catálogos usam TTL padrão de 60 s e
   agenda 20 s. Mutações incrementam a versão do namespace, invalidando todas
   as combinações sem executar `KEYS`.
2. **Pub/Sub**: canal configurável `bellaapp:domain-events`, publisher no
   cliente compartilhado e conexão duplicada para subscriber. O envelope Zod
   contém `eventId`, tipo, clínica, agregado, ator, data e metadados opcionais.

Leitura/escrita/invalidação do cache e publicação do evento são fail-open no
caso de uso. A fonte de verdade continua sendo o MySQL.

## Consequências positivas

- cache coerente entre instâncias;
- redução de consultas repetidas;
- invalidação O(1) por namespace;
- eventos e cache reutilizam a mesma infraestrutura;
- logs `published`, `received` e `processed` compartilham `eventId`;
- indisponibilidade durante uma requisição pode degradar para o banco.

## Consequências negativas e riscos

- cache é eventualmente consistente até invalidação/TTL;
- chaves antigas permanecem até expirar;
- Pub/Sub não persiste mensagens e entrega somente a assinantes conectados;
- não há retry, dead-letter queue ou confirmação de processamento;
- o startup atual aguarda Redis quando a integração está habilitada;
- memória e política de eviction precisam ser monitoradas.

## Regra de evolução

Se um evento passar a controlar uma operação financeira, notificação obrigatória
ou integração que não pode ser perdida, migrar esse fluxo para Outbox + broker
durável/Redis Streams. Pub/Sub permanece adequado para sinalização efêmera e
demonstração de eventos em tempo real.

## Atualização — 10/11/2026

A regra de evolução acima foi aplicada às notificações. Elas passaram a usar um
serviço próprio com Redis Streams, consumer group, retry e dead-letter, conforme
[ADR-0005](0005-notificacoes-redis-streams.md). O risco "não há retry,
dead-letter queue ou confirmação de processamento" continua válido apenas para
o canal Pub/Sub. A decisão de cache-aside e de Pub/Sub para sinalização não mudou.

## Evidências

- `backend/src/shared/cache/cache.service.ts`;
- `backend/src/shared/events/domain-event-bus.ts`;
- `backend/src/lib/redis.ts`;
- `docker-compose.yml`;
- testes `cache.service.spec.ts` e `domain-event-bus.spec.ts`.
