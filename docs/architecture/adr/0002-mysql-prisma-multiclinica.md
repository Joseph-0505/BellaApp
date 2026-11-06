# ADR-0002 — Persistir em MySQL com Prisma e isolamento por clínica

- **Status:** Aceita
- **Data:** 05/11/2026
- **Decisores:** equipe BellaApp

## Contexto

Clientes, serviços, profissionais, salas, agendamentos, cobranças e movimentos
financeiros possuem relações, restrições e operações transacionais. Além disso,
uma única instalação atende várias clínicas, e dados operacionais não podem
atravessar a fronteira do tenant.

## Direcionadores

- integridade referencial e transações ACID;
- migrations versionadas;
- consultas relacionais para agenda e financeiro;
- produtividade e tipagem no TypeScript;
- ambiente reproduzível no Docker/XAMPP usado pela equipe.

## Alternativas consideradas

### PostgreSQL

Atenderia os requisitos relacionais e possui recursos avançados. Não foi
escolhido porque o ambiente do projeto já utiliza MySQL e não há requisito que
justifique a migração neste estágio.

### MongoDB

Facilitaria documentos flexíveis, mas as relações e invariantes do domínio
exigiriam validação adicional na aplicação e dificultariam transações de agenda,
cobrança e caixa.

### Banco ou schema separado por clínica

Ofereceria isolamento físico maior, porém multiplicaria migrations, conexões,
backup e provisionamento. É complexidade prematura para o volume atual.

### SQL manual sem ORM

Daria controle fino, mas aumentaria código repetitivo de mapeamento, risco de
inconsistência e custo de migrations/tipagem.

## Decisão

Usar **MySQL** como fonte de verdade e **Prisma** para schema, migrations,
consultas e transações. O modelo é multiclínica em schema compartilhado:

- `Clinic` representa o tenant;
- `ClinicUser` vincula usuário, clínica, papel e profissional;
- toda entidade operacional possui `clinicId` obrigatório;
- services resolvem o contexto autenticado e repositories filtram pelo
  `clinicId` antes de ler ou alterar;
- índices e unicidades compostas preservam desempenho e regras locais, como
  CPF de cliente e nome de sala dentro da clínica.

## Consequências positivas

- transações atômicas entre agenda, cobrança e caixa;
- relações e cascatas declaradas no schema;
- cliente Prisma tipado e migrations reproduzíveis;
- um único banco simplifica backup e ambiente local;
- o tenant fica explícito no modelo e nas chaves de cache.

## Consequências negativas e riscos

- isolamento depende de toda consulta incluir `clinicId`; uma omissão pode
  causar vazamento entre tenants;
- schema compartilhado cria contenção e raio de impacto comum;
- migrations afetam todas as clínicas simultaneamente;
- Prisma pode limitar otimizações SQL específicas e requer geração de cliente;
- dados históricos de cobrança usam snapshots para não depender de alterações
  futuras no catálogo, duplicando alguns campos de forma intencional.

## Controles compensatórios

- `UserClinicContextService` centraliza a resolução do tenant e papel;
- services buscam recursos por `clinicId` e ID;
- chaves Redis também incluem clínica e escopo;
- testes de papéis e ciclo de vida verificam acesso e regras;
- constraints e índices do Prisma funcionam como segunda linha de defesa.

## Evidências

- `backend/prisma/schema.prisma`;
- `backend/src/shared/auth/user-clinic-context.ts`;
- repositories em `backend/src/modules/*`;
- migrations em `backend/prisma/migrations`.
