# ADR-0005 — Notificações em serviço separado com Redis Streams

- **Status:** Aceita
- **Data:** 10/11/2026
- **Decisores:** equipe BellaApp
- **Relacionado:** ADR-0003, KAN-51 / US-02

## Contexto

A ADR-0003 adotou Redis Pub/Sub para eventos de domínio e definiu uma regra de
evolução: fluxos que não podem ser perdidos devem migrar para um mecanismo
durável. Avisos de agendamento e de pagamento passaram a ser exigidos. Uma
mensagem Pub/Sub entregue a um consumidor que falha no meio do envio é perdida,
e o backend não deve ficar mais lento nem falhar por causa do envio de e-mail.

## Direcionadores

- envio assíncrono, sem aumentar a latência das rotas do backend;
- reprocessamento de falhas transitórias com limite de tentativas;
- isolamento de mensagens que nunca terão sucesso, sem bloquear a fila;
- reaproveitar o Redis já operado pelo projeto;
- rastreabilidade do evento de domínio até a entrega.

## Alternativas consideradas

### Enviar no próprio backend, dentro da requisição

Simples, mas acopla a latência e a disponibilidade do SMTP às rotas de agenda e
cobrança. Uma falha de e-mail viraria erro para o usuário ou seria descartada.

### RabbitMQ ou Kafka

Oferecem filas duráveis e roteamento avançado, mas adicionam um novo contêiner,
monitoramento e conhecimento operacional desproporcionais ao volume atual.

### Redis Pub/Sub com retry no consumidor

Continua sem persistência: se o processo cair, a mensagem em memória é perdida e
não há como inspecionar o que falhou.

## Decisão

Criar o processo independente `notification-service` (Fastify + TypeScript) e
usar **Redis Streams** como fila:

1. O serviço assina `bellaapp:domain-events` e converte `appointment.created`,
   `appointment.updated`, `appointment.completed`, `appointment.deleted` e
   `billing.paid` em jobs. Também aceita jobs diretos em
   `POST /api/v1/notifications`, que responde 202.
2. Os jobs entram na stream `bellaapp:notifications`, consumida pelo grupo
   `bellaapp:notification-workers` com `XREADGROUP`. Mensagens paradas há mais de
   10 s são recuperadas com `XAUTOCLAIM`.
3. Sucesso gera `XACK`. Falha reenfileira o job com `attempt + 1` até
   `NOTIFICATION_MAX_ATTEMPTS` (padrão 3).
4. Após a última tentativa, ou se o job for inválido, ele vai para
   `bellaapp:notifications:dead-letter` com data e motivo da falha.
5. A entrega padrão é por log estruturado. O modo SMTP é ativado por variáveis
   de ambiente, sem segredos versionados.

## Consequências positivas

- o backend apenas publica o evento e segue a resposta;
- jobs pendentes sobrevivem a reinícios do serviço, pois o Redis usa AOF;
- falhas transitórias são reprocessadas e falhas definitivas ficam auditáveis;
- `GET /health` expõe o tamanho da fila e da dead-letter;
- logs `notification.enqueued_from_domain_event`, `notification.retry`,
  `notification.dead_letter` e `notification.delivered` carregam
  `domainEventId` e `notificationId`.

## Consequências negativas e riscos

- a ponte Pub/Sub → Stream ainda perde eventos publicados enquanto o serviço
  está desconectado; o backend não grava um Outbox;
- o retry é imediato, sem backoff exponencial;
- a dead-letter precisa de inspeção e reprocessamento manual;
- mais um contêiner para construir, monitorar e versionar.

## Regra de evolução

Se uma notificação passar a ter valor legal ou financeiro, adotar Outbox no
backend gravando o evento na mesma transação do MySQL e publicando direto na
stream, eliminando a dependência do Pub/Sub para esse fluxo.

## Evidências

- `notification-service/src/queue.ts`: fila, worker, retry e dead-letter;
- `notification-service/src/domain-events.ts`: ponte de eventos de domínio;
- `notification-service/src/config.ts`: nomes das streams e limites;
- `notification-service/src/notification.spec.ts` e `domain-events.spec.ts`;
- serviço `notification-service` no `docker-compose.yml`, com healthcheck;
- roteiro de inspeção das filas no `README.md` raiz.
