# Product Backlog — ordem, histórias e critérios de aceite

Registro de apoio ao card KAN-40. A fonte operacional continua sendo o Jira.

> As histórias abaixo foram redigidas a partir do comportamento implementado e
> verificável no repositório. Em caso de divergência de texto, prevalece o card
> no Jira, e este arquivo deve ser corrigido.

## Ordem priorizada

1. **KAN-50 / US-01 — Catálogo rápido (Alta):** reduz impacto direto no atendimento e valida o cache distribuído.
2. **KAN-51 / US-02 — Aviso de novo agendamento (Alta):** entrega rastreabilidade do evento central do produto.
3. **KAN-52 / US-03 — Operação sem cache (Média):** protege a continuidade depois que cache e eventos já existem.
4. **KAN-53 / US-04 — Mensagens de erro claras (Média):** melhora recuperação de falhas nos fluxos já entregues.
5. **KAN-54 / US-05 — Documentação navegável (Média):** habilita integrações após estabilizar os contratos principais.
6. **KAN-55 / US-06 — Ambiente com um comando (Média):** consolida a reprodução e a demonstração do conjunto.

## Regra usada

Primeiro vêm histórias de maior valor operacional e dependências técnicas do
ciclo. Em seguida entram resiliência e usabilidade. Documentação e empacotamento
fecham o ciclo quando os contratos e os serviços que descrevem já estão estáveis.

Todas as histórias usam o formato “Como..., quero..., para...”, possuem critérios
de aceite verificáveis, prioridade do Jira, versão de entrega e vínculo `relates to`
com a tarefa técnica correspondente.

## Histórias

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
