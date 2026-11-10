# Changelog

Todas as mudanças relevantes do BellaApp serão documentadas neste arquivo. O
formato segue Keep a Changelog e o projeto adota Semantic Versioning.

## [Unreleased]

### Added

- contrato OpenAPI e Swagger UI;
- cache-aside com Redis, TTL, invalidação por versão e isolamento por clínica;
- eventos de domínio via Redis Pub/Sub e serviço assíncrono de notificações;
- Docker Compose com MySQL, Redis, backend, frontend, notificações e Nginx;
- pipeline de CI/CD, estratégia de deploy e runbooks operacionais;
- documentação de Cynefin, SLOs, SLIs, resiliência e diagnóstico.

### Changed

- eventos de criação de agendamento passam a incluir cliente, serviço,
  profissional e horário para rastreabilidade ponta a ponta.

### Fixed

- sessão expirada agora é apresentada e redirecionada de forma consistente no
  web e no mobile.

[Unreleased]: https://github.com/Joseph-0505/BellaApp/compare/HEAD...HEAD

