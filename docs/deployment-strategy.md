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

## Limitações atuais

- o deploy real depende de host e GitHub Secrets que não existem no repositório;
- não há ambiente blue/green, canary ou rollback automático de banco;
- o teste E2E completo exige o stack com TLS e usuário de teste;
- a primeira execução em produção deve ser acompanhada e anexada ao card Jira.
