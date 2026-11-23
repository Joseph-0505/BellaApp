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
  CORS e `APP_BASE_URL` no domínio público e e-mail apenas em log.
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

Rollback: `docker compose -p bellaapp down`, restaurar o backup do Caddyfile e
`caddy reload`. O ambiente é temporário e será removido depois da avaliação.

## Limitações atuais

- o job `Deploy production` depende de host e GitHub Secrets que não existem no
  repositório e continua pulado; o ambiente de demonstração é publicado à mão,
  como descrito acima;
- não há ambiente blue/green, canary ou rollback automático de banco;
- o teste E2E completo exige o stack com TLS e usuário de teste;
- a primeira execução em produção deve ser acompanhada e anexada ao card Jira.
