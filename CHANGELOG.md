# Changelog

Todas as mudanças relevantes do BellaApp serão documentadas neste arquivo. O
formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Semantic Versioning](https://semver.org/lang/pt-BR/).

As versões 1.1.0, 1.2.0 e 1.3.0 foram marcadas depois da entrega, sobre os
commits reais de `main` que as publicaram. Veja `docs/versioning.md`.

## [Unreleased]

### Added

- lembrete por e-mail 24h antes do agendamento (KAN-76): o notification-service
  guarda o lembrete num sorted set do Redis e o move para a fila quando vence;
  remarcar move o lembrete, cancelar, concluir ou remover o tira. O evento
  `appointment.updated` passa a levar os mesmos dados do cliente.

- e-mail de confirmação para o cliente quando um agendamento é criado (KAN-82):
  o evento `appointment.created` leva nome e e-mail do cliente, serviço e
  profissional, e o notification-service envia texto e HTML com o horário de
  Brasília. Cliente sem e-mail ou agendamento já concluído continua só no log.

- e-mail ao cliente quando o agendamento é cancelado, remarcado ou reaberto
  (KAN-84): o `appointment.updated` leva o horário e o status anteriores, e o
  notification-service manda o aviso de cancelamento, o de remarcação (com o
  horário antigo) ou de novo o de horário agendado. Observação, confirmação,
  exclusão e cancelamento de horário passado não geram e-mail.

- snapshot do Jira de 24/11/2026 em `docs/jira/status-2026-11-24.md`, com 81 cards,
  nove erros e a versão 1.5.0 liberada.

### Changed

- ambiente de demonstração republicado em 24/11/2026 com a versão 1.5.0 (imagens
  `4de4c58`); o registro está em `docs/deployment-strategy.md`.
- ambiente de demonstração republicado em 24/11/2026 à noite com o KAN-82 e o
  KAN-76 (imagens `03c3320` e depois `3a5ae9f`) e notificações por SMTP; o
  registro está em `docs/deployment-strategy.md`.

### Fixed

- links do `mobile/README.md` e do `mobile/docs/VALIDACAO.md` apontavam para
  documentos que foram reorganizados em `mobile/docs/`.

## [1.5.0] - 2026-11-24

### Added

- snapshot final do Jira em `docs/jira/status-2026-11-11.md`, com os 55 cards
  concluídos e as quatro versões liberadas.
- item explícito de entidades no modelo de domínio de `docs/architecture/ddd.md`.
- circuit breaker e limite de 500 ms nos comandos Redis feitos durante a requisição.
- testes da conclusão de atendimento, da cobrança única e do escopo do profissional.
- evidência de logs reais de cache e Pub/Sub em `docs/evidence/logs-cache-pubsub.md`.
- Kanban explícito, histórias do núcleo do produto e backlog pendente priorizado.
- `compose.production.yaml` e `nginx/production.conf` para o ambiente de demonstração.
- ambiente de demonstração publicado em <https://bella.flynnapp.com.br>.

### Changed

- `scripts/validate-redis-degradation.mjs` valida Redis travado e desligado, mede as
  respostas e confere a abertura e o fechamento do circuito.
- versões dos pacotes e do contrato OpenAPI passam a 1.5.0.

### Fixed

- a API e os health checks ficavam sem responder quando o Redis travava (KAN-80).
- rota inexistente respondia com o 404 nativo do Fastify, fora do envelope
  `{ error: { code, message } }`; agora responde `ROUTE_NOT_FOUND` (KAN-81).

### Removed

- binário `mkcert.exe` do repositório.

## [1.4.0] - 2026-11-11

### Added

- contrato OpenAPI completo, com profissionais, salas, plano, cobranças, caixa,
  ativação de convite, avatar e imagens de perfil;
- teste que falha quando uma rota da API não está documentada;
- ADR-0005 sobre notificações com Redis Streams, retry e dead-letter;
- user stories KAN-50 a KAN-55 com critérios de aceite no backlog versionado;
- plano de observabilidade com sinais, fontes e condições de alerta;
- mapa entre os itens da rubrica e as evidências do repositório.

### Changed

- diagramas C4 de contêineres e de implantação incluem o serviço de
  notificações;
- metas dos cenários de qualidade alinhadas aos SLOs;
- ADR avulsa de MySQL incorporada à ADR-0002, mantendo uma única série;
- PRs de promoção vindos de `develop` dispensam a chave Jira no nome e no
  título; a chave continua obrigatória em cada commit;
- versões dos pacotes e do contrato OpenAPI passam a 1.4.0.

## [1.3.0] - 2026-11-10

### Added

- serviço de notificações independente, com fila em Redis Streams, consumer
  group, até três tentativas e dead-letter queue;
- contrato OpenAPI e Swagger UI em `/docs`;
- pipeline de CI/CD no GitHub Actions, com deploy condicional e rollback;
- validação de chaves Jira em commits, branches e PRs;
- SLOs, SLIs, estratégias de resiliência e runbooks de indisponibilidade e de
  degradação do Redis;
- documentação de Cynefin, papéis, backlog priorizado e SemVer.

### Changed

- eventos de criação de agendamento passam a incluir cliente, serviço,
  profissional e horário para rastreabilidade ponta a ponta.

### Fixed

- sessão expirada agora é apresentada e redirecionada de forma consistente no
  web e no mobile.

## [1.2.0] - 2026-11-05

### Added

- cache-aside com Redis, TTL, invalidação por versão e isolamento por clínica;
- eventos de domínio via Redis Pub/Sub no canal `bellaapp:domain-events`;
- Redis no Docker Compose, com healthcheck e persistência AOF;
- endpoint `GET /api/v1/health` com estado do MySQL e do Redis;
- documentação arquitetural: C4, ADRs 0001 a 0004, DDD e cenários de
  qualidade.

### Changed

- ajustes no upload de imagens de perfil pelo mobile.

## [1.1.0] - 2026-09-16

### Added

- API Fastify com autenticação JWT, onboarding, clientes, serviços,
  profissionais, salas, agenda, cobranças, caixa e plano;
- aplicação web em React e Vite;
- aplicativo mobile em Expo com CRUDs, upload de imagens e documentação de
  casos de uso, atividades, sequência e DER;
- Docker Compose com MySQL, backend, frontend e Nginx;
- Nginx como proxy reverso com HTTPS local e cabeçalhos de segurança;
- testes E2E com Playwright e hooks de qualidade com Husky.

[Unreleased]: https://github.com/Joseph-0505/BellaApp/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Joseph-0505/BellaApp/releases/tag/v1.1.0
