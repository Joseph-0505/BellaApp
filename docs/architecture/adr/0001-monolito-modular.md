# ADR-0001 — Adotar monólito modular no backend

- **Status:** Aceita
- **Data:** 05/11/2026
- **Decisores:** equipe BellaApp

## Contexto

O BellaApp atende autenticação, configuração da clínica, catálogos, agenda e
financeiro. A equipe precisa evoluir essas capacidades com transações entre
módulos, implantação simples e uma base de código compreensível para um projeto
acadêmico, sem a sobrecarga operacional de vários serviços independentes.

## Direcionadores

- manter uma única implantação e um único pipeline de backend;
- permitir transações consistentes, como concluir agendamento e gerar cobrança;
- separar regras HTTP, aplicação e persistência;
- facilitar testes unitários e integração;
- preservar caminho de extração futura caso um contexto precise escalar sozinho.

## Alternativas consideradas

### Microserviços por capacidade

Separar identidade, agenda, catálogo e financeiro em processos e bancos
independentes. Aumentaria isolamento e escalabilidade seletiva, mas exigiria
descoberta de serviços, contratos remotos, observabilidade distribuída,
consistência eventual e infraestrutura desproporcional ao estágio atual.

### Backend sem fronteiras explícitas

Manter uma aplicação única organizada apenas por camadas globais. Seria simples
no início, porém aumentaria o acoplamento entre funcionalidades e dificultaria
encontrar regras e responsáveis.

### Funções serverless

Distribuir endpoints em funções. Reduziria gestão de servidor, mas fragmentaria
transações e ciclo de vida de Prisma, Redis, uploads e subscriber Pub/Sub.

## Decisão

Usar um **monólito modular** em TypeScript/Fastify. Cada capacidade reside em
`backend/src/modules/<modulo>` e, quando aplicável, separa:

- `routes`: contrato e middleware HTTP;
- `controller`: tradução entre HTTP e caso de uso;
- `service`: autorização e regras de negócio;
- `repository`: consultas Prisma;
- `schemas`/`dtos`: validação e tipos de entrada/saída;
- `mapper`: tradução de registro persistido para resposta pública.

Infraestrutura transversal fica em `shared`, `lib` e `config`. Relações entre
contextos são chamadas internas explícitas ou envelopes de evento Redis.

## Consequências positivas

- uma imagem e um processo de backend;
- transações Prisma abrangem casos de uso entre módulos;
- menor custo operacional e depuração local direta;
- organização por capacidade reduz dispersão de mudanças;
- módulos podem ser testados com dependências simuladas.

## Consequências negativas e riscos

- todos os módulos escalam e são implantados juntos;
- falha grave do processo afeta todas as capacidades;
- fronteiras dependem de disciplina, pois TypeScript não impede imports
  indevidos;
- schema e Prisma compartilhados permitem acoplamento por banco;
- extração futura exige explicitar contratos que hoje são chamadas internas.

## Evidências

- `backend/src/app/app.ts` registra todos os módulos;
- `backend/src/modules/appointments` exemplifica a separação completa;
- `backend/src/shared/http/error-handler.ts` concentra política transversal;
- testes unitários dos services simulam repositories e integrações.
