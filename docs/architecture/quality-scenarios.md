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
de versão após mutação foram comprovados no Docker. As metas de carga e p95 são
metas propostas e ainda precisam de k6/Artillery ou ferramenta equivalente.

## Q-02 — Disponibilidade diante de falha do cache

| Elemento | Definição |
|---|---|
| Fonte | Redis deixa de responder depois que a API já está em execução |
| Estímulo | Um usuário solicita uma listagem cacheada |
| Artefato | Cliente Redis, cache-aside, MySQL e health check |
| Ambiente | API e MySQL disponíveis; Redis indisponível |
| Resposta | A API registra `cache.read_failed`, consulta o MySQL e não retorna dado de outra clínica; o health check sinaliza a dependência como `down` |
| Medida | A requisição deve terminar sem corrupção; resposta da listagem em até 6 s; `/api/v1/health` retorna 503 enquanto Redis estiver indisponível |

**Evidência atual:** teste unitário do comportamento fail-open em
`cache.service.spec.ts` e injeção de falha automatizada em
`scripts/validate-redis-degradation.mjs`, que para o Redis, confirma a
listagem com HTTP 200 pelo MySQL, religa o Redis e confirma a volta do cache. O
roteiro manual está em [redis-degradation.md](../runbooks/redis-degradation.md).

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
| Q-01 | Parcial: testes de cache | Duas leituras e comparação de logs/chaves; depois teste de carga |
| Q-02 | Sim: teste unitário e `scripts/validate-redis-degradation.mjs` | Executar o script com o stack no ar e mostrar os logs `cache.read_failed` |
| Q-03 | Parcial: health e erros | Pausar MySQL em ambiente isolado e observar 503/log sanitizado |
| Q-04 | Parcial: testes de papéis/escopo | Duas clínicas, tentativa cruzada e inspeção do cache |
| Q-05 | Sim, em testes de serviço/integração existentes | Concluir atendimento e conferir cobrança única |
| Q-06 | Não automatizado | Reiniciar sem `-v` e consultar dado anterior |
| Q-07 | Sim: typecheck/testes/lint | Mostrar estrutura e executar a suíte |
