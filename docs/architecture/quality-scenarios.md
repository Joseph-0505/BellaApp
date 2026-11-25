# Cenários de qualidade mensuráveis

Data da revisão: 10/11/2026.

## Como ler

Cada cenário segue a estrutura: **fonte**, **estímulo**, **artefato**,
**ambiente**, **resposta** e **medida**. A coluna de evidência separa o que já
foi observado das metas que ainda exigem experimento.

Os números de latência, disponibilidade e taxa de cache são os mesmos SLOs de
[slo-observability.md](../reliability/slo-observability.md). Aquele documento é
a fonte única das metas; os cenários descrevem como cada uma é provocada e medida.

## Q-01 — Desempenho de consulta frequente

| Elemento | Definição |
|---|---|
| Fonte | Usuários web/mobile autenticados da mesma clínica |
| Estímulo | Repetem uma consulta paginada de serviços, clientes, profissionais, salas ou agenda com os mesmos filtros |
| Artefato | API Fastify, `CacheService`, Redis e repositório Prisma |
| Ambiente | Stack Docker saudável; até 20 requisições por segundo; páginas de até 100 itens |
| Resposta | A primeira requisição lê a origem e preenche o cache; as seguintes reutilizam o valor isolado por clínica e escopo |
| Medida | Após aquecimento, taxa de hit ≥ 80% no catálogo de serviços e latência p95 de leitura ≤ 400 ms (SLOs de cache e de latência de leitura); leitura em miss p95 ≤ 1.500 ms |

**Evidência atual:** o fluxo miss → hit, a existência das chaves, TTL e mudança
de versão após mutação foram comprovados no Docker.

**Teste de carga (KAN-78, 25/11/2026):** `scripts/load/run-q01.sh` roda o k6
(`scripts/load/q01-listagens.js`) por 2 min a 20 req/s, alternando as listagens
de serviços, clientes, profissionais, salas e agenda com os mesmos filtros
(`limit=50`, 20 serviços, 20 clientes e 10 agendamentos numa clínica criada pelo
próprio teste). Depois conta `cache.hit` e `cache.miss` no log do backend.
Stack Docker local; na terceira rodada, o backend com os limites de produção do
`compose.production.yaml` (0,5 CPU e 256 MB).

| Rodada | Requisições | Falhas | p95 das listagens | p99 | Hit em `services` |
|---|---:|---:|---:|---:|---:|
| 1, sem limite | 2.400 | 0 | 17,7 ms | 25,2 ms | 99,6% (478/480) |
| 2, sem limite | 2.401 | 0 | 19,5 ms | 26,5 ms | 99,6% (479/481) |
| 3, 0,5 CPU e 256 MB | 2.401 | 0 | 54,9 ms | 97,2 ms | 99,6% (479/481) |

As metas de p95 ≤ 400 ms e hit ≥ 80% foram cumpridas nas três rodadas, e o p95
de cada listagem ficou abaixo de 56 ms. Os misses são as expirações de TTL (60 s
no catálogo e 20 s na agenda, que teve 98,8% de hit). A meta de miss p95 ≤ 1.500 ms
não teve medição própria porque houve poucos misses, mas nenhuma leitura passou
de 457 ms. Fora do teste ficaram o Nginx na frente da API e a VPS de
demonstração, que não recebeu carga.

## Q-02 — Disponibilidade diante de falha do cache

| Elemento | Definição |
|---|---|
| Fonte | Redis deixa de responder depois que a API já está em execução |
| Estímulo | Um usuário solicita uma listagem cacheada |
| Artefato | Cliente Redis, circuit breaker, cache-aside, MySQL e health check |
| Ambiente | API e MySQL disponíveis; Redis desligado ou travado (aceita conexão e não responde) |
| Resposta | Cada comando tem limite de 500 ms. A API registra `cache.read_failed`, consulta o MySQL e, após 3 falhas seguidas, abre o circuito e para de chamar o Redis por 30 s; o health check sinaliza a dependência como `down` |
| Medida | Toda listagem responde em até 1,5 s; com o circuito aberto, não há espera pelo Redis; `/api/v1/health` retorna 503; ao voltar, o circuito fecha sem reiniciar o backend |

**Evidência atual:** `circuit-breaker.spec.ts`, `cache.service.spec.ts` e injeção
de falha automatizada em `scripts/validate-redis-degradation.mjs`, que trava e
depois desliga o Redis, mede cada resposta e confirma os logs de abertura e
fechamento do circuito. O roteiro manual está em
[redis-degradation.md](../runbooks/redis-degradation.md).

Medição local de 18/11/2026, no Docker, com a máquina ocupada por outra suíte de
testes. Os valores servem para comparar a ordem de grandeza, não como SLO:

| Situação | Antes do limite e do circuito | Depois |
|---|---|---|
| Redis travado: 3 primeiras listagens | sem resposta em 15 s, quando o teste desistiu | cerca de 530 ms cada |
| Redis travado: listagens seguintes | sem resposta em 15 s | 24 a 36 ms |
| Redis travado: cadastro de serviço | sem resposta em 15 s | cerca de 540 ms |
| Redis travado: `/api/v1/health` | sem resposta em 15 s | 503 em cerca de 510 ms |
| Redis desligado: listagens | 29 a 49 ms | 23 a 50 ms |

O defeito foi registrado em KAN-80. Com o Redis desligado o comando falha na hora,
por isso o teste anterior não o revelava.

## Q-03 — Detecção de indisponibilidade da fonte de verdade

| Elemento | Definição |
|---|---|
| Fonte | MySQL deixa de responder |
| Estímulo | Docker executa o health check ou um usuário envia uma operação transacional |
| Artefato | `HealthService`, Prisma e tratador global de erros |
| Ambiente | Backend em execução, banco indisponível |
| Resposta | O health check marca MySQL `down`; falhas inesperadas retornam resposta sanitizada e são registradas com request ID |
| Medida | `/api/v1/health` retorna 503; nenhuma resposta expõe SQL, credenciais ou stack trace; diagnóstico correlacionável pelo `X-Request-Id` |

## Q-04 — Isolamento multiclínica

| Elemento | Definição |
|---|---|
| Fonte | Usuário autenticado da clínica A |
| Estímulo | Tenta consultar ou alterar um identificador pertencente à clínica B |
| Artefato | JWT, `UserClinicContextService`, services e repositories |
| Ambiente | Operação normal com duas clínicas e dados homônimos |
| Resposta | O backend aplica `clinicId` do vínculo autenticado e nega ou não encontra o recurso externo ao escopo |
| Medida | Zero registros da clínica B na resposta; tentativa resulta em 403/404; nenhum cache é compartilhado entre os escopos |

## Q-05 — Consistência ao concluir atendimento

| Elemento | Definição |
|---|---|
| Fonte | Administrador ou profissional autorizado |
| Estímulo | Conclui um agendamento válido |
| Artefato | Agendamento, cobrança, transação Prisma, cache e evento |
| Ambiente | MySQL disponível; Redis pode estar disponível ou não |
| Resposta | Agendamento fica `COMPLETED` e uma cobrança idempotente é criada na mesma transação; caches são invalidados e o evento é tentado depois do commit |
| Medida | Nunca existe cobrança sem atendimento concluído por falha parcial dessa operação; reexecução não duplica a cobrança; falha de Redis não desfaz o commit |

## Q-06 — Recuperação e persistência local

| Elemento | Definição |
|---|---|
| Fonte | Operador reinicia o stack Docker |
| Estímulo | Executa `docker compose down` e depois `docker compose up -d` sem remover volumes |
| Artefato | Compose, volume `mysql_data`, volume `profile_uploads` e migrations Prisma |
| Ambiente | Máquina de desenvolvimento com os volumes preservados |
| Resposta | MySQL volta com os dados, migrations pendentes são aplicadas e os serviços respeitam a ordem de prontidão |
| Medida | Health check retorna 200 após a recuperação e um registro criado antes do reinício continua consultável |

## Q-07 — Modificabilidade do backend

| Elemento | Definição |
|---|---|
| Fonte | Desenvolvedor adiciona um novo recurso HTTP |
| Estímulo | Implementa rota, validação, regra, persistência e resposta |
| Artefato | Monólito modular Fastify |
| Ambiente | Desenvolvimento e revisão por pull request |
| Resposta | A mudança fica concentrada em um módulo e contratos compartilhados necessários, sem acessar HTTP dentro do repository nem Prisma dentro do controller |
| Medida | Novo módulo segue routes/controller/service/repository/DTO/schema; typecheck e testes passam; nenhuma dependência circular é introduzida |

## Matriz de verificação

| Cenário | Automatizado hoje | Demonstração recomendada |
|---|---|---|
| Q-01 | Sim: testes de cache e teste de carga k6 em `scripts/load/` (KAN-78), rodado à mão | Duas leituras e comparação de logs/chaves; depois `scripts/load/run-q01.sh` |
| Q-02 | Sim: testes unitários e `scripts/validate-redis-degradation.mjs` | Executar o script com o stack no ar e mostrar `redis.circuit_open` e `redis.circuit_closed` nos logs |
| Q-03 | Parcial: health e erros | Pausar MySQL em ambiente isolado e observar 503/log sanitizado |
| Q-04 | Parcial: testes de papéis/escopo | Duas clínicas, tentativa cruzada e inspeção do cache |
| Q-05 | Parcial: `appointments.service.spec.ts` e `billings.service.spec.ts` cobrem conclusão, repetição e recusa com repositórios simulados; o rollback real da transação no MySQL não é testado | Concluir atendimento e conferir cobrança única |
| Q-06 | Não automatizado | Reiniciar sem `-v` e consultar dado anterior |
| Q-07 | Sim: typecheck/testes/lint | Mostrar estrutura e executar a suíte |
