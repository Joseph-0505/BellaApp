# Estratégia de deploy e recuperação

Relacionado a KAN-8 / ARQ-05.

## Decisão

O BellaApp usa **rolling recreate em host único com Docker Compose**. Um push em
`main` executa todas as verificações do pipeline; quando o environment de
produção está habilitado, o job de deploy conecta por SSH, posiciona o repositório
no SHA aprovado, reconstrói os serviços e verifica `GET /api/v1/health` dentro do
contêiner do backend.

Essa estratégia foi escolhida porque o projeto opera hoje em um único host e não
possui orquestrador nem balanceador para blue/green ou canary. Ela mantém o custo
operacional compatível com o estágio do produto, mas admite uma breve janela de
indisponibilidade durante a recriação.

## Proteções

- deploy somente após build e testes de backend, web, mobile e notificações;
- build do Docker Compose antes do job de produção;
- environment `production` do GitHub, que pode exigir aprovação manual;
- credenciais somente em GitHub Secrets e variáveis do environment;
- recusa do deploy quando há mudanças locais no servidor;
- healthcheck após a subida;
- rollback automático do código para o SHA anterior quando build, subida ou
  verificação falham.

## Configuração do environment

Defina no GitHub sem versionar valores:

| Tipo | Nome | Uso |
|---|---|---|
| Variable | `DEPLOY_ENABLED` | Deve ser `true` para habilitar o job. |
| Variable | `DEPLOY_APP_DIR` | Caminho absoluto do clone no servidor. |
| Secret | `DEPLOY_HOST` | Host SSH. |
| Secret | `DEPLOY_USER` | Usuário SSH com acesso ao Docker. |
| Secret | `DEPLOY_SSH_KEY` | Chave privada dedicada ao deploy. |
| Secret | `DEPLOY_KNOWN_HOSTS` | Chave pública do host SSH previamente verificada. |

O servidor mantém seus próprios `.env`, `backend/.env` e certificados, todos fora
do Git. O clone remoto deve conhecer o origin e o usuário precisa executar Git e
Docker Compose no diretório configurado.

## Procedimento normal

1. Criar branch contendo a chave Jira, por exemplo `feature/KAN-53-erros-claros`.
2. Usar a chave em todos os commits e no título do PR.
3. Abrir PR para `develop` e aguardar CI verde.
4. Promover por PR de `develop` para `main`. Esse PR agrupa várias histórias,
   por isso o job `Jira references` dispensa a chave no nome da branch e no
   título e continua exigindo a chave em cada commit.
5. Aprovar o environment de produção, quando configurado.
6. Conferir o job `Deploy production`, o healthcheck e os logs do serviço.

## Rollback

O script `scripts/deploy-remote.sh` guarda o SHA anterior antes da mudança. Se a
nova versão falhar, ele executa automaticamente:

1. `git checkout --detach <sha-anterior>`;
2. `docker compose up -d --build --remove-orphans`;
3. nova verificação de saúde do backend.

Para rollback manual, use o mesmo procedimento com o SHA estável e valide o
runbook de indisponibilidade.

## Banco de dados

Rollback de código não desfaz migrations. Toda migration deve seguir
**expand/contract**: primeiro adicionar estruturas compatíveis, migrar dados e
somente remover campos em uma versão posterior. Antes de uma migration destrutiva,
é obrigatório criar e testar backup. Se a falha envolver dados, interrompa o
rollback automático, preserve evidências e siga o plano de restauração aprovado.

## Ambiente de demonstração publicado

Relacionado a KAN-65. No ar desde 19/11/2026 em <https://bella.flynnapp.com.br>.

O ambiente roda num servidor compartilhado com outros projetos, atrás de um Caddy
que já é dono das portas 80/443 e encerra o TLS. Por isso ele não usa o job
`Deploy production` acima, e sim uma publicação manual com estas regras:

- **Imagens construídas fora do servidor.** O build roda na máquina de
  desenvolvimento (mesma arquitetura `amd64`) e as imagens seguem por
  `docker save | ssh docker load`, conferindo os IDs dos dois lados. O servidor
  nunca compila nada: um build com o disco cheio já derrubou serviços vizinhos.
- **Override de produção.** `compose.production.yaml` troca o build pelas imagens
  `bellaapp-*:${BELLAAPP_TAG}`, tira as portas do host, monta
  `nginx/production.conf` (HTTP puro, o TLS fica com o Caddy) e impõe limite de
  memória e CPU por serviço. Só o `bellaapp-nginx` entra na rede do proxy
  (`horarius_web`); MySQL, Redis e backend ficam na rede interna.
- **Segredos gerados no servidor.** `.env` e `backend/.env` são criados lá com
  valores aleatórios e `chmod 600`, com `NODE_ENV=production`, `LOG_LEVEL=info`,
  CORS e `APP_BASE_URL` no domínio público e e-mail apenas em log. Desde a
  republicação de 24/11 à noite, o notification-service envia por SMTP (conta
  Google Workspace); os convites do backend continuam em log.
- **Proxy.** O bloco `bella.flynnapp.com.br` → `bellaapp-nginx:80` foi acrescentado
  ao Caddyfile depois de um backup, validado com `caddy validate` e aplicado com
  `caddy reload`, sem reiniciar o proxy. O mesmo bloco foi versionado no
  repositório de infraestrutura do servidor, para que o deploy de lá não o apague.

Comandos usados (no servidor, em `/opt/apps/bellaapp`):

```bash
docker compose -p bellaapp -f docker-compose.yml -f compose.production.yaml up -d --no-build
docker compose -p bellaapp ps
```

Verificação feita em 19/11/2026, com a tag `5cd2e64`:

- os seis serviços `healthy`; `GET /api/v1/health`, `/` e `/docs/` com 200 pela
  rede do proxy e depois pelo domínio, com certificado válido;
- uso em repouso de ~362 MiB (MySQL 174, backend 71, frontend 56, notificações 53,
  Nginx 5, Redis 4);
- os outros sites do servidor continuaram respondendo 200 depois do reload.

Republicação feita em 24/11/2026, com a tag `4de4c58` (versão 1.5.0):

- antes do envio, o conteúdo das três imagens foi comparado por hash com o código
  versionado; depois do `docker load`, os IDs bateram dos dois lados;
- no servidor só mudou o valor de `BELLAAPP_TAG` no `.env`, com cópia do arquivo
  anterior. O mesmo `up -d --no-build` recriou backend, frontend e notificações em
  22 s, sem recriar MySQL, Redis e Nginx;
- `GET /api/v1/health` com 200 e dependências `up`; `/docs/json` informa a versão
  1.5.0; rota inexistente responde 404 com `ROUTE_NOT_FOUND` e `X-Request-Id`
  (KAN-81);
- os outros sites do servidor responderam 200 antes e depois da troca.

Republicações feitas em 24/11/2026 à noite (21h19 e 21h28 em Brasília, 25/11 em
UTC), com o e-mail de confirmação (KAN-82, tag `03c3320`) e depois o lembrete de
24h (KAN-76, tag `3a5ae9f`), ambas sobre commits de merge em `main`:

- as imagens do backend e do notification-service foram construídas a partir de
  um worktree limpo de `main` no commit da tag; depois do `docker load`, os IDs
  bateram dos dois lados (`458b153cae3f`/`95297dc68208` e
  `0806d01b2fa6`/`3303a7c8b29c`);
- o frontend não mudou desde `4de4c58` (`git diff` vazio em `Frontend/`), então a
  mesma imagem (`73c1e0613dee`) recebeu as novas tags no servidor, sem novo envio;
- no `.env` do servidor, com cópias `.env.bak-4de4c58` e `.env.bak-03c3320`,
  mudou o `BELLAAPP_TAG` e entraram `NOTIFICATION_MAIL_DELIVERY_MODE=smtp` e as
  variáveis `NOTIFICATION_SMTP_*`, sem valores versionados. O mesmo
  `up -d --no-build` recriou backend, frontend e notificações, sem recriar MySQL,
  Redis e Nginx;
- `GET /api/v1/health` e `/` com 200 pelo domínio; os outros sites do servidor
  responderam 200 antes e depois de cada troca;
- de dentro do contêiner, `nodemailer.verify()` autenticou no `smtp.gmail.com:587`;
- um agendamento criado pela API pública gerou `notification.delivered` com
  `transport: smtp`, e o lembrete entrou no sorted set
  `bellaapp:notifications:reminders` (contagem de 0 para 1).

Republicação feita em 25/11/2026 (10h38 em Brasília), tag `b2ad11c` (merge do
PR #41 em `main`), com KAN-83 (convite pelo notification-service), KAN-77 (trava
de concorrência na agenda), KAN-85 (reabrir cancelado confere conflito) e KAN-84
(e-mail ao cancelar, remarcar ou reabrir):

- as imagens do backend e do notification-service foram construídas a partir de
  um worktree limpo de `main` em `b2ad11c`; depois do `docker load`, os IDs
  bateram dos dois lados (`95edf786634c` e `2d72a12b8721`). O frontend não mudou
  desde `3a5ae9f`, e a mesma imagem (`73c1e0613dee`) recebeu a tag nova;
- antes de subir, o conteúdo das imagens foi conferido: backend sem `nodemailer`,
  com `NOTIFICATION_SERVICE_URL`, a trava `FOR UPDATE` e o estado anterior no
  `appointment.updated`; notification-service com os textos de cancelamento e
  remarcação;
- no servidor, com cópias `.env.bak-3a5ae9f` e `docker-compose.yml.bak-3a5ae9f`,
  mudou o `BELLAAPP_TAG` e o `docker-compose.yml` ganhou só a linha
  `NOTIFICATION_SERVICE_URL: http://notification-service:3001` no backend
  (`docker compose config` validou antes da subida). Sem migração de banco. O
  mesmo `up -d --no-build` recriou backend, frontend e notificações em 22 s, sem
  recriar MySQL, Redis e Nginx;
- `GET /api/v1/health` com 200 e dependências `up`; `/` e `/docs/` com 200; rota
  inexistente com 404 `ROUTE_NOT_FOUND`; os outros sites do servidor responderam
  com o mesmo status antes e depois da troca;
- de dentro do backend, `NOTIFICATION_SERVICE_URL/health` respondeu 200 com fila
  e dead-letter vazias; de dentro do notification-service, `nodemailer.verify()`
  autenticou no SMTP;
- não houve envio de e-mail de teste em produção: convite, cancelamento e
  remarcação foram verificados ponta a ponta só no stack local, em modo log.

O convite de profissional, que antes só ia para o log do backend no servidor,
passa a sair de verdade pelo SMTP do notification-service.

Republicação feita em 25/11/2026 (11h31 em Brasília) com a tag `02e05c0`, o
merge do PR #46 em `main` marcado como `v1.6.0`. Desde `b2ad11c` só mudaram os
números de versão dos pacotes e do OpenAPI, além de documentação:

- as três imagens foram construídas a partir de um worktree limpo da tag
  `v1.6.0`, porque o `package.json` do frontend também mudou; depois do
  `docker load`, os IDs bateram dos dois lados (backend `47bb587c68fe`,
  notification-service `de0dc78018b1`, frontend `582a7d4a7418`);
- no servidor só mudou o `BELLAAPP_TAG` no `.env`, com cópia `.env.bak-b2ad11c`;
  o `docker-compose.yml` e o `compose.production.yaml` já eram os da tag (mesmo
  hash). O `up -d --no-build` recriou backend, frontend e notificações em 22 s,
  sem recriar MySQL, Redis e Nginx;
- `/docs/json` informa a versão 1.6.0; `GET /api/v1/health` com 200 e
  dependências `up`; `/` e `/docs/` com 200; rota inexistente com 404; o backend
  alcança o notification-service; os outros sites do servidor responderam com o
  mesmo status antes e depois.

As imagens `5cd2e64`, `4de4c58`, `03c3320`, `3a5ae9f` e `b2ad11c` continuam no
servidor. Para voltar à `b2ad11c`, restaurar `.env.bak-b2ad11c` e repetir o
comando de subida. Para a `3a5ae9f`, restaurar `.env.bak-3a5ae9f` e
`docker-compose.yml.bak-3a5ae9f`; para a versão 1.5.0, restaurar
`.env.bak-4de4c58` e o mesmo `docker-compose.yml.bak-3a5ae9f`.

Remoção do ambiente: `docker compose -p bellaapp down`, restaurar o backup do
Caddyfile e `caddy reload`. O ambiente é temporário e será removido depois da
avaliação.

## Limitações atuais

- o job `Deploy production` depende de host e GitHub Secrets que não existem no
  repositório e continua pulado; o ambiente de demonstração é publicado à mão,
  como descrito acima;
- não há ambiente blue/green, canary ou rollback automático de banco;
- o teste E2E completo exige o stack com TLS e usuário de teste;
- a primeira execução em produção deve ser acompanhada e anexada ao card Jira.
