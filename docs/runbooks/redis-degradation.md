# Runbook: degradação e recuperação do Redis

Relacionado a KAN-21, KAN-22 e KAN-52.

## Resultado esperado

Com o Redis parado ou travado, consultas ao catálogo continuam respondendo pelo
MySQL e agendamentos continuam sendo criados. O backend registra
`cache.read_failed` ou `domain_event.publish_failed` e, após 3 falhas seguidas,
`redis.circuit_open`. Depois que o Redis volta, a primeira chamada liberada após 30 s
registra `redis.circuit_half_open` e `redis.circuit_closed`, e o cache volta a ser
usado sem reiniciar o backend.

## Demonstração reproduzível

A validação automatizada trava o Redis, depois o desliga, mede cada resposta e
sempre o restaura. Leva cerca de 1 minuto e meio:

```bash
node scripts/validate-redis-degradation.mjs
```

Para simular só o travamento:

```bash
docker compose pause redis
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
docker compose logs --since=2m backend | grep 'redis.circuit'
docker compose unpause redis
```

Roteiro manual do Redis desligado. Pré-requisito: stack iniciado, usuário
autenticado e token armazenado em `TOKEN`.

```bash
docker compose up --build -d
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
docker compose logs backend | grep 'cache.hit'
```

Interrompa somente o Redis e repita a consulta:

```bash
docker compose stop redis
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
docker compose logs --since=2m backend | grep 'cache.read_failed'
```

A resposta do catálogo deve continuar com HTTP 200. A rota de health pode ficar
degradada/503 para sinalizar a dependência, sem impedir as rotas de negócio que
possuem fallback.

Recupere o Redis:

```bash
docker compose start redis
docker compose exec redis redis-cli ping
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
curl -i -H "Authorization: Bearer $TOKEN" https://bellaapp.local/api/v1/services
docker compose logs --since=2m backend | grep 'cache.hit'
```

O `PING` deve retornar `PONG`. Passados 30 s da abertura do circuito, a primeira
leitura repopula o cache e a segunda registra `cache.hit`, sem reiniciar o backend.

## Escalonamento

- se o MySQL também falhar, seguir `application-down.md`;
- se o Redis não reconectar após cinco minutos, reiniciar apenas o serviço Redis
  e preservar o volume `redis_data`;
- não executar `docker compose down -v`, pois `-v` remove os dados persistidos.

