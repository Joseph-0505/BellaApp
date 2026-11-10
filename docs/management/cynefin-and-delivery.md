# Cynefin e abordagem de entrega do BellaApp

Relacionado a KAN-37, KAN-38 e KAN-39.

## Classificação

O BellaApp está predominantemente no domínio **Complexo** do Cynefin. Existe uma
direção de produto conhecida — administrar clínica, clientes, serviços e agenda —,
mas a melhor solução emerge conforme a equipe integra web, mobile, API, banco,
cache e notificações e recebe retorno sobre os fluxos reais.

Evidências da classificação:

- os requisitos evoluem durante a implementação e a validação das telas;
- conflitos de agenda, isolamento por clínica, cache e eventos possuem efeitos de
  interação que só ficam claros com protótipos e testes integrados;
- a equipe é pequena e trabalha sob uma data fixa de apresentação, o que exige
  aprender e repriorizar rapidamente;
- há partes **Complicadas**, como Prisma, Redis, Nginx e CI/CD, nas quais boas
  práticas e análise técnica são suficientes, mas elas não removem a incerteza do
  produto como um todo.

O contexto não é Simples, pois não há uma relação única e óbvia entre requisito e
solução. Também não é Caótico: há arquitetura, backlog, testes e tempo para
experimentar antes de agir em modo de crise.

## Abordagem escolhida

A gestão é **híbrida, com execução ágil e marcos preditivos**:

1. Os marcos da rúbrica, as datas de entrega e a apresentação são planejados de
   forma preditiva.
2. Dentro de cada marco, a equipe usa ciclos curtos de `sondar → perceber →
   responder`: implementa uma fatia pequena, executa testes, registra evidência e
   ajusta o backlog.
3. Itens de maior risco — integração, cache, eventos e deploy — são validados cedo.
4. O Jira é a fonte do estado; o repositório contém decisões, implementação e
   evidências reproduzíveis.

Essa abordagem decorre do domínio Complexo: não se tenta prever todos os detalhes
antes de desenvolver, mas as restrições fixas da avaliação continuam visíveis.

## Papéis e responsabilidades

Os papéis refletem a distribuição registrada no Jira e não criam silos: toda
entrega recebe revisão cruzada.

| Pessoa | Papel principal | Responsabilidades |
|---|---|---|
| José Victor | Produto, arquitetura e experiência | Refinar jornadas web/mobile, manter coerência arquitetural, revisar critérios da rúbrica e conduzir a narrativa da demonstração. |
| Mauro Cardoso Felix Neto | Backend, plataforma e qualidade | Evoluir API, cache/eventos, Compose e CI/CD; automatizar testes; manter rastreabilidade e evidências no Jira. |
| Ambos | Revisão e apresentação | Revisar PRs, validar critérios de aceite, ensaiar cenários e decidir repriorizações. |

Responsabilidades operacionais:

- quem assume o card implementa e anexa a evidência;
- o outro integrante revisa critérios, testes e impacto;
- bloqueios e mudanças de escopo são registrados no card;
- somente itens demonstráveis são movidos para Concluído.

## Ciclo de trabalho

`A fazer → Em andamento → Em revisão → Concluído`.

Uma entrega é considerada pronta quando seus critérios estão cobertos por código
ou documentação, a validação local passa, a evidência está no Jira e existe um
roteiro de demonstração. Dependências externas não comprovadas permanecem abertas.

## Roteiro de explicação

1. Mostrar no Jira os marcos fixos e a priorização do backlog.
2. Explicar por que a incerteza de produto torna o contexto Complexo.
3. Apontar um experimento real: cache-aside com falha aberta e recuperação.
4. Mostrar como os marcos preditivos convivem com ciclos curtos de implementação.
5. Apresentar os papéis, a revisão cruzada e uma evidência vinculada a um card.

