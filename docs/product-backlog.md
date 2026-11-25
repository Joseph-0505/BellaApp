# Product Backlog — ordem, histórias e critérios de aceite

Registro de apoio ao card KAN-40. A fonte operacional continua sendo o Jira.

> As histórias US-01 a US-12 foram redigidas a partir do comportamento implementado
> e verificável no repositório; US-07 a US-12 foram registradas no Jira em
> 18/11/2026, depois de a funcionalidade existir. US-13 e US-14 são trabalho futuro.
> Em caso de divergência de texto, prevalece o card no Jira, e este arquivo deve ser
> corrigido.

## Ordem priorizada

### Pendente (v1.6.0 Evolução)

1. **KAN-77 / BE-08 — Concorrência no conflito de agenda (Alta):** fecha a limitação registrada no modelo de domínio antes de abrir novos canais de agendamento.
2. **KAN-78 / ARQ-08 — Teste de carga (Média):** mede os SLOs de latência que ainda são metas.
3. **KAN-79 / US-14 — Autoagendamento por link (Média):** depende do controle de concorrência, porque aumenta a disputa por horários.

### Entregue

| Ordem | Card | História | Prioridade | Versão |
|---:|---|---|---|---|
| 1 | KAN-70 | US-07 Agendar sem conflito de horário | Alta | v1.1.0 |
| 2 | KAN-71 | US-08 Cadastrar e manter clientes | Alta | v1.1.0 |
| 3 | KAN-73 | US-10 Concluir atendimento com cobrança única | Alta | v1.5.0 (testes) |
| 4 | KAN-75 | US-12 Profissional acessa a própria agenda | Alta | v1.5.0 (testes) |
| 5 | KAN-50 | US-01 Catálogo rápido | Alta | v1.2.0 |
| 6 | KAN-51 | US-02 Aviso de novo agendamento | Alta | v1.2.0 |
| 7 | KAN-72 | US-09 Manter o catálogo de serviços | Média | v1.1.0 |
| 8 | KAN-74 | US-11 Convidar profissional | Média | v1.1.0 |
| 9 | KAN-52 | US-03 Operação sem cache | Média | v1.3.0 |
| 10 | KAN-53 | US-04 Mensagens de erro claras | Média | v1.3.0 |
| 11 | KAN-54 | US-05 Documentação navegável | Média | v1.3.0 |
| 12 | KAN-55 | US-06 Ambiente com um comando | Média | v1.1.0 |
| 13 | KAN-82 | US-15 E-mail de confirmação de agendamento | Alta | v1.6.0 (Unreleased) |
| 14 | KAN-76 | US-13 Lembrete de agendamento | Alta | v1.6.0 (Unreleased) |

## Regra usada

Primeiro vem o que sustenta a operação da clínica: agenda, clientes e cobrança.
Depois, histórias de maior valor operacional e dependências técnicas do ciclo. Em
seguida entram resiliência e usabilidade. Documentação e empacotamento fecham o
ciclo quando os contratos e os serviços que descrevem já estão estáveis. No backlog
pendente, um item que reduz risco de outro vem antes dele.

Todas as histórias usam o formato “Como..., quero..., para...”, possuem critérios
de aceite verificáveis, prioridade do Jira e versão de entrega.

## Histórias do núcleo do produto

### KAN-70 / US-07 — Agendar sem conflito de horário

**Como** recepcionista, **quero** agendar um atendimento e ser impedida de marcar
um horário ocupado, **para** não prometer dois atendimentos ao mesmo tempo.

- Prioridade: Alta. Versão: v1.1.0 Fundação.
- Critérios de aceite:
  1. **Dado** cliente, serviço e profissional válidos em horário livre, **quando**
     crio o agendamento, **então** ele é salvo.
  2. **Dado** um agendamento ativo que se sobrepõe ao horário, **quando** crio
     outro, **então** recebo erro 409.
  3. **Dado** uma data no passado, **quando** crio, **então** ele é recusado.
  4. **Dado** um agendamento cancelado ou concluído no horário, **quando** crio
     outro, **então** ele não gera conflito.
- Evidência: `appointments.service.spec.ts`, `crud.integration.spec.ts` e
  `resources.http.spec.ts`.

### KAN-71 / US-08 — Cadastrar e manter clientes

**Como** recepcionista, **quero** cadastrar e manter os clientes, **para** encontrar
os dados deles na hora de agendar.

- Prioridade: Alta. Versão: v1.1.0 Fundação.
- Critérios de aceite:
  1. **Dado** os campos obrigatórios preenchidos, **quando** salvo, **então** o
     cliente aparece na lista.
  2. **Dado** um campo obrigatório vazio, **quando** salvo, **então** o cadastro não
     é concluído.
  3. **Dado** um cliente existente, **quando** edito ou excluo, **então** a lista
     reflete a mudança.
  4. **Dado** clientes de outra clínica, **quando** consulto, **então** eles não
     aparecem para mim.
- Evidência: `e2e/clientes.spec.ts` e `crud.integration.spec.ts`.

### KAN-72 / US-09 — Manter o catálogo de serviços

**Como** administradora, **quero** manter os serviços com preço e duração, **para**
que a agenda e a cobrança usem valores corretos.

- Prioridade: Média. Versão: v1.1.0 Fundação.
- Critérios de aceite:
  1. **Dado** um nome válido, **quando** salvo o serviço, **então** ele aparece no
     catálogo.
  2. **Dado** o nome vazio, **quando** salvo, **então** o cadastro não é concluído.
  3. **Dado** um preço negativo, **quando** envio, **então** recebo erro de validação.
  4. **Dado** um serviço existente, **quando** edito ou excluo, **então** o catálogo
     reflete a mudança.
- Evidência: `e2e/servicos.spec.ts` e `resources.http.spec.ts`.

### KAN-73 / US-10 — Concluir atendimento com cobrança única

**Como** profissional, **quero** concluir o atendimento e ter a cobrança criada
automaticamente, **para** não lançar nem duplicar valores à mão.

- Prioridade: Alta. Versão: v1.5.0, que adiciona os testes de um comportamento
  existente desde a v1.1.0.
- Critérios de aceite:
  1. **Dado** um agendamento ativo, **quando** concluo, **então** ele fica concluído
     e a cobrança é criada na mesma transação.
  2. **Dado** um atendimento já concluído, **quando** repito a conclusão, **então**
     nenhuma cobrança nova é criada.
  3. **Dado** um agendamento cancelado, **quando** tento concluir, **então** recebo
     erro 409 e nenhuma cobrança é criada.
- Evidência: `appointments.service.spec.ts` e `billings.service.spec.ts`.

### KAN-74 / US-11 — Convidar profissional

**Como** administradora, **quero** convidar um profissional por e-mail, **para** que
ele tenha acesso sem eu definir a senha dele.

- Prioridade: Média. Versão: v1.1.0 Fundação.
- Critérios de aceite:
  1. **Dado** um convite enviado, **quando** o profissional ativa a conta, **então**
     ele consegue fazer login normalmente.
  2. **Dado** um convite reenviado, **quando** o token anterior é usado, **então** ele
     não é mais aceito.
- Evidência: `invite-activation.integration.spec.ts`.

### KAN-75 / US-12 — Profissional acessa apenas a própria agenda

**Como** profissional, **quero** ver e alterar somente meus atendimentos, **para**
que a agenda dos colegas fique protegida.

- Prioridade: Alta. Versão: v1.5.0, que adiciona os testes de um comportamento
  existente desde a v1.1.0.
- Critérios de aceite:
  1. **Dado** que sou profissional, **quando** filtro a agenda por outro profissional,
     **então** recebo erro 403.
  2. **Dado** um agendamento de outro profissional, **quando** tento concluí-lo,
     **então** recebo erro 403.
  3. **Dado** que sou profissional, **quando** tento criar serviço ou sala, **então**
     recebo erro 403.
- Evidência: `appointments.service.spec.ts` e `role-access.integration.spec.ts`.

## Histórias pendentes

### KAN-76 / US-13 — Lembrete de agendamento

**Como** recepcionista, **quero** que o cliente receba um lembrete antes do horário,
**para** reduzir faltas.

- Prioridade: Alta. Versão planejada: v1.6.0 Evolução.
- Critérios de aceite:
  1. **Dado** um agendamento confirmado com e-mail do cliente, **quando** faltam 24
     horas, **então** um lembrete entra na fila de notificações.
  2. **Dado** um agendamento cancelado ou remarcado, **quando** chega o horário antigo
     do lembrete, **então** nada é enviado.
  3. **Dado** uma falha de entrega, **quando** as tentativas se esgotam, **então** o
     envio vai para a dead-letter.
- Entrega: lembrete 24h antes para agendamento agendado ou confirmado de cliente
  com e-mail; remarcar move o lembrete, cancelar, concluir ou remover o tira.
- Testes: `notification-service/src/reminders.spec.ts` (critérios 1 e 2),
  `notification-service/src/queue.spec.ts` (critério 3) e
  `backend/src/modules/appointments/appointments.service.spec.ts` (dados do
  cliente no evento de atualização).

### KAN-79 / US-14 — Autoagendamento por link público

**Como** cliente da clínica, **quero** escolher serviço e horário por um link,
**para** agendar sem depender do telefone.

- Prioridade: Média. Versão planejada: v1.6.0 Evolução.
- Critérios de aceite:
  1. **Dado** o link da clínica, **quando** abro, **então** vejo somente serviços
     ativos e horários livres.
  2. **Dado** um horário livre, **quando** confirmo, **então** o agendamento aparece na
     agenda da clínica.
  3. **Dado** que o horário foi ocupado antes da confirmação, **quando** confirmo,
     **então** sou avisada e escolho outro.

### KAN-82 / US-15 — E-mail de confirmação de agendamento

**Como** cliente da clínica, **quero** receber um e-mail quando meu horário for
agendado, **para** ter a confirmação com serviço, data e profissional.

- Prioridade: Alta. Versão planejada: v1.6.0 Evolução.
- Critérios de aceite:
  1. **Dado** um agendamento novo, agendado ou confirmado, de cliente com e-mail,
     **quando** ele é criado, **então** um e-mail com serviço, data e horário de
     Brasília e profissional entra na fila de notificações.
  2. **Dado** um cliente sem e-mail ou um agendamento criado já concluído,
     **quando** ele é criado, **então** nada é enviado ao cliente e o evento segue
     só no log.
  3. **Dado** uma falha de entrega, **quando** as tentativas se esgotam, **então**
     o envio vai para a dead-letter.
- Testes: `notification-service/src/domain-events.spec.ts` (critérios 1 e 2),
  `notification-service/src/queue.spec.ts` (critério 3: retry e dead-letter) e
  `backend/src/modules/appointments/appointments.service.spec.ts` (dados do
  cliente no evento).

### KAN-84 / US-16 — E-mail de cancelamento e remarcação

**Como** cliente da clínica, **quero** receber um e-mail quando meu horário for
cancelado, remarcado ou reaberto, **para** não ir à clínica no horário errado.

- Prioridade: Média. Versão planejada: v1.6.0 Evolução.
- Critérios de aceite:
  1. **Dado** um agendamento futuro em aberto de cliente com e-mail, **quando** ele
     é cancelado, **então** um e-mail de cancelamento com serviço e horário entra
     na fila de notificações.
  2. **Dado** um agendamento em aberto, **quando** o horário muda, **então** um
     e-mail de remarcação com o horário novo e o anterior entra na fila.
  3. **Dado** um agendamento cancelado, **quando** ele volta a ficar agendado ou
     confirmado, **então** o cliente recebe de novo o e-mail de horário agendado.
  4. **Dado** só uma mudança de observação, de agendado para confirmado, ou a
     exclusão do agendamento, **então** nada é enviado ao cliente e o evento segue
     só no log.
  5. **Dado** o cancelamento de um horário que já passou, **então** nada é enviado
     ao cliente.
- Testes: `notification-service/src/domain-events.spec.ts` (critérios 1 a 5) e
  `backend/src/modules/appointments/appointments.service.spec.ts` (estado
  anterior no evento).

## Histórias técnicas e de qualidade

### KAN-50 / US-01 — Catálogo rápido

**Como** recepcionista da clínica, **quero** que a lista de serviços abra rápido
mesmo quando consultada várias vezes, **para** atender o cliente sem esperar.

- Prioridade: Alta. Versão planejada: v1.2.0 Cache e eventos.
- Critérios de aceite:
  1. **Dado** um catálogo já consultado, **quando** a mesma listagem é repetida
     com os mesmos filtros, **então** a resposta vem do Redis e o log registra
     `cache.hit`.
  2. **Dado** um serviço criado, alterado ou excluído, **quando** a listagem é
     consultada de novo, **então** o dado novo aparece sem esperar o TTL.
  3. **Dado** duas clínicas com filtros iguais, **quando** cada uma consulta,
     **então** nenhuma recebe dados em cache da outra.
  4. A entrada expira sozinha após 60 s no catálogo e 20 s na agenda.
- Evidência: `backend/src/shared/cache/cache.service.spec.ts` e o fluxo
  “Leitura com cache” em `docs/architecture/c4.md`.

### KAN-51 / US-02 — Aviso de novo agendamento

**Como** administradora da clínica, **quero** ser avisada quando um agendamento
é criado, **para** acompanhar a agenda sem atualizar a tela.

- Prioridade: Alta. Versão planejada: v1.2.0 Cache e eventos.
- Critérios de aceite:
  1. **Dado** um agendamento salvo, **quando** a transação termina, **então** o
     evento `appointment.created` é publicado com `eventId`, clínica, cliente,
     serviço, profissional e horário.
  2. **Dado** o evento publicado, **quando** o serviço de notificações o recebe,
     **então** um job é enfileirado e o log liga `domainEventId` ao
     `notificationId`.
  3. **Dado** que a publicação falha, **quando** o agendamento é criado,
     **então** o agendamento continua salvo e o log registra
     `domain_event.publish_failed`.
- Evidência: `backend/src/shared/events/domain-event-bus.spec.ts`,
  `notification-service/src/domain-events.spec.ts` e ADR-0005.

### KAN-52 / US-03 — Operação sem cache

**Como** usuária da clínica, **quero** continuar usando o sistema quando o cache
cai, **para** não interromper o atendimento.

- Prioridade: Média. Versão planejada: v1.3.0 Qualidade e API.
- Critérios de aceite:
  1. **Dado** o Redis parado, **quando** o catálogo é consultado, **então** a API
     responde HTTP 200 a partir do MySQL e registra `cache.read_failed`.
  2. **Dado** o Redis parado, **quando** `GET /api/v1/health` é chamado,
     **então** responde 503 indicando Redis `down`.
  3. **Dado** o Redis religado, **quando** a consulta se repete, **então** o
     cache volta a ser usado sem reiniciar o backend.
- Evidência: `scripts/validate-redis-degradation.mjs`,
  `docs/runbooks/redis-degradation.md` e cenário Q-02.

### KAN-53 / US-04 — Mensagens de erro claras

**Como** usuária, **quero** mensagens de erro compreensíveis, **para** saber o
que corrigir sem ver detalhes técnicos.

- Prioridade: Média. Versão planejada: v1.3.0 Qualidade e API.
- Critérios de aceite:
  1. Todo erro da API segue o envelope `{ error: { code, message, details? } }`.
  2. Dados inválidos retornam 400 `VALIDATION_ERROR` com o campo e o motivo.
  3. Erros inesperados retornam 500 genérico, sem SQL, stack trace ou segredos,
     e o log guarda o `X-Request-Id`.
  4. **Dado** um token expirado, **quando** a renovação falha, **então** web e
     mobile encerram a sessão e mostram “Sua sessão expirou. Entre novamente.”
- Evidência: `backend/src/shared/http/error-handler.spec.ts`,
  `Frontend/bellaapp-frontend/src/services/api.js` e `mobile/src/services/api.ts`.

### KAN-54 / US-05 — Documentação navegável

**Como** desenvolvedora que integra com o BellaApp, **quero** uma documentação
interativa da API, **para** testar rotas sem ler o código.

- Prioridade: Média. Versão planejada: v1.3.0 Qualidade e API.
- Critérios de aceite:
  1. `https://bellaapp.local/docs/` abre o Swagger UI e `/docs/json` serve o
     contrato OpenAPI.
  2. O botão **Authorize** aceita o token do login e testa rotas protegidas.
  3. Toda rota `/api/` do backend está documentada, com exemplos e erros.
- Evidência: `backend/openapi/openapi.yaml`, `backend/src/app/openapi.spec.ts`
  e `docs/api-validation.md`.

### KAN-55 / US-06 — Ambiente com um comando

**Como** integrante da equipe ou avaliadora, **quero** subir todo o sistema com
um comando, **para** reproduzir a demonstração em qualquer máquina.

- Prioridade: Média. Versão planejada: v1.4.0 Entrega.
- Critérios de aceite:
  1. `docker compose up --build` sobe MySQL, Redis, backend, notification-service,
     frontend e Nginx, respeitando os healthchecks.
  2. As migrations são aplicadas automaticamente antes de o backend iniciar.
  3. `https://bellaapp.local` abre o sistema e HTTP redireciona para HTTPS.
  4. `npm run test:e2e` passa contra o stack no ar.
- Evidência: `docker-compose.yml`, `nginx/default.conf`, `README.md` e os testes
  em `Frontend/bellaapp-frontend/e2e`.
