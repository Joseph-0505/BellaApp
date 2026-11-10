# ADR 0001 — MySQL como banco transacional

- Status: aceito
- Data: 2026-11-09
- Decisores: equipe BellaApp
- Relacionado: KAN-6 / ARQ-03

## Contexto

O BellaApp mantém dados transacionais de clínicas, usuários, clientes, serviços,
profissionais, salas, agendamentos, cobranças e caixa. Esses dados têm relações
fortes, precisam respeitar isolamento entre clínicas e participam de operações
que devem ser atômicas, como concluir um atendimento e gerar sua cobrança.

A equipe também precisa de um ambiente reproduzível para desenvolvimento e
demonstração. O backend já utiliza Prisma, e o stack é executado com Docker
Compose.

## Decisão

Usar MySQL como banco de dados transacional principal, acessado pelo Prisma. A
imagem `mysql:lts` roda em um contêiner sem porta pública no ambiente padrão,
com volume persistente, healthcheck e migrations aplicadas pelo backend antes da
inicialização.

Redis não substitui o MySQL: é usado somente para cache, Pub/Sub e filas. Uma
indisponibilidade do Redis não pode comprometer a fonte de verdade transacional.

## Alternativas consideradas

### PostgreSQL

Atenderia aos mesmos requisitos de consistência e oferece recursos avançados,
como tipos e consultas JSON mais ricos. Não foi escolhido porque o time já tinha
experiência operacional, modelo Prisma e ambiente local baseados em MySQL. A
troca não entregaria benefício proporcional ao custo neste ciclo.

### MongoDB

Facilitaria documentos com estrutura variável, mas as entidades do BellaApp são
altamente relacionais. Garantir integridade referencial, consultas de agenda,
escopo por clínica e transações de cobrança exigiria mais lógica na aplicação.

### SQLite

É simples para testes e protótipos locais, porém não representa adequadamente o
uso concorrente e a operação em contêineres esperados para demonstração e
evolução do produto.

## Consequências

### Positivas

- transações ACID e restrições relacionais para os fluxos financeiros e de agenda;
- integração estável com Prisma e migrations versionadas;
- execução reproduzível no Docker Compose;
- persistência entre reinícios por volume nomeado;
- banco isolado da rede externa no arquivo Compose de produção local.

### Negativas e riscos

- o MySQL é um ponto crítico: sua indisponibilidade deixa a API degradada;
- migrations precisam ser compatíveis com dados existentes e revisadas antes do deploy;
- consultas e índices devem ser acompanhados conforme o volume crescer;
- recursos específicos do MySQL aumentam o custo de uma futura migração.

## Salvaguardas

- healthcheck do MySQL no Compose e no endpoint `GET /api/v1/health`;
- `prisma migrate deploy` antes de iniciar o backend;
- volume `mysql_data` para persistência;
- testes de integração dos fluxos transacionais;
- credenciais somente por variáveis de ambiente, sem versionar segredos.

## Critério para revisitar

Reavaliar a decisão se surgirem requisitos comprovados que o MySQL não atenda,
como recursos geoespaciais avançados, replicação multi-região específica ou uma
carga documental predominante. A revisão deve comparar métricas e custo de
migração, não apenas preferência tecnológica.
