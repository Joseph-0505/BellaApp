# Evidência de logs: cache e Pub/Sub

Relacionado a KAN-9, KAN-10, KAN-50, KAN-51 e KAN-67.

Logs capturados em 2026-11-18, no commit `f082582`, com o stack do Docker Compose
e `LOG_LEVEL=debug`. Foram mantidos somente os campos úteis para a leitura. O
identificador da clínica de teste foi trocado por `<clinica>` nas chaves.

## Cache-aside, TTL e invalidação

Sequência executada em `/api/v1/services`:

1. primeira listagem: `cache.miss`;
2. mesma listagem: `cache.hit`;
3. `TTL` da chave no Redis: **59 segundos**;
4. espera de 61 segundos: `EXISTS` da chave retornou **0**, ou seja, ela expirou;
5. nova listagem: `cache.miss`, seguida de `cache.hit`;
6. cadastro de serviço: `cache.invalidated`, que incrementa a versão do namespace;
7. listagem seguinte: `cache.miss` em uma chave de versão nova.

```text
{"time":"2026-11-18T23:18:05.427Z","event":"cache.miss","namespace":"services","key":"bellaapp:v1:services:<clinica>:admin:74dad6e8-19bf-46c5-9484-ced6322693fd:v0:20502c394fedad542399"}
{"time":"2026-11-18T23:18:05.507Z","event":"cache.hit","namespace":"services","key":"bellaapp:v1:services:<clinica>:admin:74dad6e8-19bf-46c5-9484-ced6322693fd:v0:20502c394fedad542399"}
{"time":"2026-11-18T23:19:08.359Z","event":"cache.miss","namespace":"services","key":"bellaapp:v1:services:<clinica>:admin:74dad6e8-19bf-46c5-9484-ced6322693fd:v0:20502c394fedad542399"}
{"time":"2026-11-18T23:19:08.391Z","event":"cache.hit","namespace":"services","key":"bellaapp:v1:services:<clinica>:admin:74dad6e8-19bf-46c5-9484-ced6322693fd:v0:20502c394fedad542399"}
{"time":"2026-11-18T23:19:08.428Z","event":"cache.invalidated","namespaces":["services"]}
{"time":"2026-11-18T23:19:08.455Z","event":"cache.miss","namespace":"services","key":"bellaapp:v1:services:<clinica>:admin:74dad6e8-19bf-46c5-9484-ced6322693fd:v1:20502c394fedad542399"}
```

## Evento de domínio ponta a ponta

Um agendamento criado gera `appointment.created`. O mesmo `domainEventId` aparece na
publicação, no consumo pelo backend e no serviço de notificações, que enfileira o
aviso em Redis Streams. O worker é tão rápido que `notification.delivered` pode ser
registrado milissegundos antes do log de enfileiramento; os dois têm o mesmo
`notificationId`.

```text
[backend] {"time":"2026-11-18T23:19:10.714Z","event":"domain_event.published","domainEventId":"a9579fc2-04c9-48e5-b617-d3d32c614eda","domainEventType":"appointment.created","subscribers":2}
[backend] {"time":"2026-11-18T23:19:10.719Z","event":"domain_event.received","domainEventId":"a9579fc2-04c9-48e5-b617-d3d32c614eda","domainEventType":"appointment.created"}
[backend] {"time":"2026-11-18T23:19:10.720Z","event":"domain_event.processed","domainEventId":"a9579fc2-04c9-48e5-b617-d3d32c614eda","domainEventType":"appointment.created"}
[notification-service] {"time":"2026-11-18T23:19:10.751Z","event":"notification.delivered","notificationId":"4c5576ce-16ec-4a1d-bf66-9c9482fa33c9","channel":"log"}
[notification-service] {"time":"2026-11-18T23:19:10.754Z","event":"notification.enqueued_from_domain_event","domainEventId":"a9579fc2-04c9-48e5-b617-d3d32c614eda","domainEventType":"appointment.created","notificationId":"4c5576ce-16ec-4a1d-bf66-9c9482fa33c9"}
```

## Como reproduzir

```bash
docker compose logs backend | grep -E 'cache\.(miss|hit|invalidated)'
docker compose logs backend notification-service | grep '<domainEventId>'
```
