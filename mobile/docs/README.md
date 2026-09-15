# Documentação acadêmica e técnica — BellaApp Mobile

Revisão: 14/09/2026.

Esta pasta reúne os artefatos solicitados para documentar o BellaApp. O escopo principal é o aplicativo mobile em React Native/Expo; o backend Fastify/Prisma é considerado quando ele executa regras de negócio ou persiste dados consumidos pelo aplicativo.

## Entregáveis

| Item solicitado | Situação antes desta organização | Documento atual |
|---|---|---|
| Contextualização do problema e evolução do produto | Existia em `mobile/EVOLUCAO.md` | [01 — Contexto e evolução](01-CONTEXTO-E-EVOLUCAO.md) |
| Diagrama entidade-relacionamento | Não existia | [03 — DER](03-DIAGRAMA-ENTIDADE-RELACIONAMENTO.md) |
| Requisitos funcionais e não funcionais | Existiam em `mobile/REQUISITOS.md` | [02 — Requisitos e auditoria](02-REQUISITOS-E-AUDITORIA.md) |
| Mínimo de 2 diagramas de casos de uso | Não existiam | [04 — Casos de uso](04-DIAGRAMAS-CASOS-DE-USO.md) |
| Mínimo de 2 diagramas de atividades | Não existiam | [05 — Atividades](05-DIAGRAMAS-ATIVIDADES.md) |
| Mínimo de 2 diagramas de sequência | Não existiam | [06 — Sequência](06-DIAGRAMAS-SEQUENCIA.md) |
| Material para gerar os visuais em outra IA | Não existia | [07 — Pacote para IA](07-PACOTE-PARA-IA-VISUAL.md) |

## Resultado da verificação

Os fluxos documentados foram localizados no código, mas “implementado” neste material significa implementação estática identificada, não homologação completa em aparelhos e banco real. Em 14/09/2026 foram executados com sucesso:

- `npm test`: 4 testes aprovados;
- `npx tsc --noEmit`: sem erros;
- `npm run lint`: sem erros.

Continuam pendentes testes ponta a ponta em Android/iOS, auditoria com leitor de tela e confirmação das mutações em um banco de homologação. O relatório detalhado e as lacunas estão em [02 — Requisitos e auditoria](02-REQUISITOS-E-AUDITORIA.md).

## Como gerar os diagramas visuais

As imagens prontas estão em [`imagens/`](imagens/README.md): oito diagramas em PNG (resolução 2×) e SVG (vetorial). Cada documento dos itens 03 a 06 também mostra suas imagens e links para download. Consulte o [guia de regeneração](imagens/README.md#regenerar-as-imagens) para atualizar as exportações a partir do código dos diagramas.

Os diagramas estão escritos em Mermaid ou PlantUML. Eles podem ser renderizados diretamente por ferramentas compatíveis ou enviados a outra IA. Para evitar que a IA invente módulos, use o [prompt consolidado](07-PACOTE-PARA-IA-VISUAL.md) junto com os arquivos 03 a 06.
