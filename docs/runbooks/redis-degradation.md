# Runbook: degradação e recuperação do Redis

Relacionado a KAN-21, KAN-22 e KAN-52.

## Resultado esperado

Com o Redis parado, consultas ao catálogo continuam respondendo pelo MySQL e
agendamentos continuam sendo criados. O backend registra `cache.read_failed` ou
`domain_event.publish_failed`. Após o Redis voltar, novas consultas voltam a
popular e usar o cache sem reiniciar o backend.

## Demonstração reproduzível

A validação automatizada executa o cenário completo e sempre religa o Redis:

```bash
node scripts/validate-redis-degradation.mjs
```

Pré-requisito: stack iniciado, usuário autenticado e token armazenado em `TOKEN`.

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

O `PING` deve retornar `PONG`, a primeira leitura repopula o cache e a segunda
registra `cache.hit`, sem reiniciar o backend.

## Escalonamento

- se o MySQL também falhar, seguir `application-down.md`;
- se o Redis não reconectar após cinco minutos, reiniciar apenas o serviço Redis
  e preservar o volume `redis_data`;
- não executar `docker compose down -v`, pois `-v` remove os dados persistidos.

