# Changelog

Todas as mudanças relevantes do BellaApp serão documentadas neste arquivo. O
formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Semantic Versioning](https://semver.org/lang/pt-BR/).

As versões 1.1.0, 1.2.0 e 1.3.0 foram marcadas depois da entrega, sobre os
commits reais de `main` que as publicaram. Veja `docs/versioning.md`.

## [Unreleased]

Nada pendente.

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

[Unreleased]: https://github.com/Joseph-0505/BellaApp/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Joseph-0505/BellaApp/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Joseph-0505/BellaApp/releases/tag/v1.1.0
