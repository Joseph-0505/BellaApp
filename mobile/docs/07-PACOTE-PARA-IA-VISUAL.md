# Pacote para gerar os diagramas visuais em outra IA

## Arquivos a enviar

Envie estes quatro documentos:

1. `03-DIAGRAMA-ENTIDADE-RELACIONAMENTO.md`;
2. `04-DIAGRAMAS-CASOS-DE-USO.md`;
3. `05-DIAGRAMAS-ATIVIDADES.md`;
4. `06-DIAGRAMAS-SEQUENCIA.md`.

Se a IA precisar de contexto funcional, envie também `01-CONTEXTO-E-EVOLUCAO.md` e `02-REQUISITOS-E-AUDITORIA.md`.

## Prompt pronto para copiar

```text
Você é um analista de sistemas e designer de diagramas UML. Com base exclusivamente nos documentos anexados do BellaApp, produza os diagramas visuais abaixo:

1. Um Diagrama Entidade-Relacionamento do núcleo usado pelo mobile.
2. Dois Diagramas de Casos de Uso:
   a) acesso, onboarding e conta;
   b) gestão da clínica e agenda.
3. Dois Diagramas de Atividades:
   a) login e direcionamento inicial;
   b) criação de agendamento.
4. Dois Diagramas de Sequência:
   a) login, onboarding e restauração de sessão;
   b) criação de agendamento com alternativa de conflito.

Regras obrigatórias:
- não invente funcionalidades, atores, tabelas, campos ou integrações;
- preserve nomes, cardinalidades, condições, mensagens e fluxos alternativos fornecidos;
- diferencie visualmente Mobile, API, banco e atores;
- mostre que salas, cobranças e caixa existem no backend, mas não possuem interface mobile;
- deixe explícito que o cliente da clínica não é usuário autenticado do app;
- use português do Brasil e corrija apenas ortografia, sem mudar a semântica;
- use fundo claro, tipografia legível e paleta rosa suave (#B75C75), rosa claro (#F8E8ED), cinza escuro (#2D2630), verde suave (#7B9E87) e branco;
- entregue cada diagrama separadamente, em orientação adequada para leitura acadêmica;
- gere versões SVG e PNG em alta resolução;
- além da imagem, devolva o código Mermaid ou PlantUML final para permitir edição.

Antes de desenhar, liste em até 10 itens qualquer ambiguidade encontrada. Se não houver ambiguidade, gere os sete diagramas diretamente. Não transforme módulos marcados como pendentes em funcionalidades entregues.
```

## Prompt alternativo para uma única prancha

```text
Crie uma prancha acadêmica A3 horizontal intitulada “BellaApp — Modelagem e Fluxos do Sistema”. Organize os sete diagramas fornecidos em seções numeradas, com legenda de cores para Usuário, Mobile, API e Banco. Mantenha todos os textos legíveis quando impressos, sem resumir entidades, cardinalidades ou fluxos alternativos. Entregue também cada seção isolada em SVG.
```

## Checklist para revisar a imagem gerada

- Há exatamente um DER principal, dois casos de uso, duas atividades e duas sequências.
- `Cliente` aparece como cadastro da clínica, não como ator autenticado.
- Administrador e profissional possuem permissões diferentes.
- O profissional fica restrito aos seus agendamentos.
- A criação do agendamento inclui data futura, duração do serviço e conflito.
- O login inclui refresh token/SecureStore e desvio para onboarding.
- Itens somente do backend não são exibidos como telas mobile.
- Todas as cardinalidades do DER permanecem visíveis.

