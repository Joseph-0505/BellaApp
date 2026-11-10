# Runbook — aplicação indisponível

Relacionado a KAN-8 / ARQ-05. Objetivo: diagnosticar, recuperar e verificar o
BellaApp sem expor segredos ou destruir evidências.

## Sinais

- a URL da aplicação não responde;
- `GET /api/v1/health` retorna 503;
- healthcheck do Compose marca backend, MySQL ou Redis como unhealthy;
- aumento de HTTP 5xx ou reinícios de contêineres.

## Triagem inicial

1. Registre horário, release/SHA, ambiente, sintoma e quem iniciou o atendimento.
2. Verifique o estado sem reiniciar imediatamente:

   ```bash
   docker compose ps
   docker compose logs --since=15m nginx backend mysql redis notification-service
   ```

3. Consulte a saúde pela borda e pelo backend:

   ```bash
   curl -k https://bellaapp.local/api/v1/health
   docker compose exec -T backend node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(async r => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1) })"
   ```

4. Correlacione logs pelo `X-Request-Id`. Nunca copie tokens, cookies, senhas ou
   conteúdo de `.env` para o ticket.

## Diagnóstico por dependência

### Backend indisponível

```bash
docker compose logs --since=15m backend
docker compose restart backend
```

Se houver erro de build, configuração ou migration após uma release, faça rollback
do código conforme `docs/deployment-strategy.md`.

### MySQL indisponível

```bash
docker compose ps mysql
docker compose logs --since=15m mysql
docker compose exec -T mysql mysqladmin ping -uroot -p
```

Não remova o volume `mysql_data`. Confirme espaço em disco e permissões do host.
Restauração de backup exige aprovação e registro do ponto de recuperação.

### Redis indisponível

```bash
docker compose ps redis
docker compose logs --since=15m redis
docker compose exec -T redis redis-cli ping
```

O backend deve continuar consultando o MySQL quando o cache falha. Reinicie apenas
o Redis e depois confira cache/eventos nos logs. Notificações pendentes permanecem
na stream persistida, salvo perda explícita do volume.

### Nginx ou TLS

```bash
docker compose logs --since=15m nginx
docker compose exec -T nginx nginx -t
```

Confirme validade, caminho e permissão dos certificados. Não versione chaves.

## Recuperação e rollback

1. Para falha transitória isolada, reinicie somente o serviço afetado.
2. Para regressão de release, execute o SHA estável anterior:

   ```bash
   git checkout --detach <sha-estavel>
   docker compose up -d --build --remove-orphans
   ```

3. Se uma migration incompatível já foi aplicada, não force rollback do código.
   Escalone para restauração ou correção forward conforme o plano de banco.

## Verificação

- todos os serviços esperados aparecem healthy em `docker compose ps`;
- `/api/v1/health` retorna 200 com MySQL `up` e Redis `up` ou `disabled`;
- login funciona sem expor detalhes internos;
- listagem de clientes e agenda respondem;
- criação de um agendamento de teste é persistida;
- logs não continuam gerando 5xx após a recuperação.

## Encerramento

Registre no Jira: causa, impacto, duração, SHA afetado, comandos de recuperação,
resultado da verificação e ações preventivas. Anexe somente logs sanitizados.
