# Arquitetura do BellaApp

Este diretório reúne as evidências das tarefas Jira **KAN-1 (ARQ-01)** e
**KAN-2 (ARQ-02)**. A documentação descreve o sistema encontrado no
repositório em 05/11/2026, revisado em 10/11/2026 para incluir o serviço de
notificações; quando algo é apenas uma meta ou uma proposta, o
texto identifica isso explicitamente.

## Mapa dos documentos

| Entrega | Documento | Critério atendido |
|---|---|---|
| C4 Nível 1 e Nível 2 | [c4.md](c4.md) | Usuários, sistemas externos, frontend, backend, persistência e relações |
| Decisões arquiteturais | [adr/README.md](adr/README.md) | Contexto, alternativas, decisão e consequências |
| Cenários de qualidade | [quality-scenarios.md](quality-scenarios.md) | Estímulo, ambiente, resposta e medida verificável |
| Context Map e Bounded Contexts | [ddd.md](ddd.md) | Domínios, subdomínios, fronteiras e relacionamentos |
| Modelo de domínio | [ddd.md](ddd.md#modelo-do-domínio-de-agendamento) | Entidades, Value Objects, agregados, raiz e invariantes |
| SLOs, resiliência e observabilidade | [../reliability/slo-observability.md](../reliability/slo-observability.md) | SLIs, SLOs, estratégias de resiliência e plano de observabilidade |

## Fontes de verdade examinadas

- `docker-compose.yml`, `docker-compose.override.yml` e `nginx/default.conf`;
- `backend/src/app/app.ts` e os módulos em `backend/src/modules`;
- `backend/prisma/schema.prisma`;
- `backend/src/shared/auth`, `backend/src/shared/cache` e
  `backend/src/shared/events`;
- `notification-service/src` (fila, worker e assinatura de eventos);
- `Frontend/bellaapp-frontend/src`;
- `mobile/src` e a auditoria existente em `mobile/docs`.

Os diagramas são mantidos como Mermaid dentro dos arquivos Markdown. Assim,
fonte e visualização ficam juntas, revisáveis por pull request e sem depender
de um arquivo binário proprietário.

## Roteiro de apresentação

Tempo sugerido: **7 a 9 minutos**.

1. **Problema e atores — 45 s.** Explique que o BellaApp centraliza clientes,
   catálogo, profissionais, agenda e financeiro de uma clínica. Diferencie o
   administrador, o profissional e o cliente cadastrado, que ainda não é um
   usuário autenticado.
2. **C4 Contexto — 45 s.** Mostre a fronteira do BellaApp e a integração SMTP
   opcional para convites.
3. **C4 Contêineres — 90 s.** Percorra Web/Mobile → Nginx/API → MySQL/Redis.
   Destaque que o mobile não acessa o banco e que todo dado operacional possui
   escopo de clínica.
4. **ADRs — 90 s.** Resuma por que foram escolhidos monólito modular, MySQL com
   Prisma, Redis e Docker Compose/Nginx. Cite ao menos uma consequência negativa
   de cada decisão.
5. **Qualidade — 60 s.** Apresente um cenário de desempenho e um de
   disponibilidade. Diga quais medidas já têm evidência e quais são metas para
   teste de carga/falha.
6. **DDD — 90 s.** Mostre o Context Map, explique as fronteiras lógicas do
   monólito e use Agendamento como núcleo do domínio.
7. **Exemplo — 60 s.** Narre a criação de um agendamento: autenticação, escopo
   da clínica, referências válidas, data futura, detecção de conflito,
   persistência, invalidação de cache e evento.
8. **Evidência reproduzível — 45 s.** Execute os comandos abaixo.

## Evidência reproduzível

Com o Docker Desktop em execução, na raiz do projeto:

```powershell
docker compose up --build -d
docker compose ps
docker compose exec redis redis-cli PING
curl.exe --noproxy * -k --resolve bellaapp.local:443:127.0.0.1 https://bellaapp.local/api/v1/health
```

Testes da API:

```powershell
cd backend
npx jest --config jest.unit.config.cjs --runInBand
npx tsc -p tsconfig.json --noEmit
```

Resultados já observados em 02/11/2026, antes do serviço de notificações: cinco
serviços iniciados, Redis com
`PONG`, health check HTTPS com MySQL e Redis `up`, e 14 suítes/63 testes do
backend aprovados.

## Limites declarados

- Os Bounded Contexts são **fronteiras lógicas** dentro de um monólito modular;
  eles ainda compartilham o mesmo schema MySQL e o mesmo processo de API.
- Os Value Objects de Agendamento estão modelados conceitualmente neste
  documento, mas hoje são representados no código por DTOs validados, enums do
  Prisma e tipos primitivos.
- Redis Pub/Sub fornece entrega em tempo real, não durável e no máximo uma vez
  para assinantes conectados. Por isso as notificações usam uma fila persistente
  em Redis Streams, com retry e dead-letter ([ADR-0005](adr/0005-notificacoes-redis-streams.md)).
  Um evento publicado enquanto o serviço de notificações está desconectado ainda
  pode ser perdido antes de chegar à fila.
- As metas de latência deste pacote não são resultados históricos. Precisam ser
  validadas por teste de carga antes de serem tratadas como SLO cumprido.
