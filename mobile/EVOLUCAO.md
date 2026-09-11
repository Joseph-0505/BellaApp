# Evolução do BellaApp

Revisão: 10/09/2026. Escopo: aplicativo mobile e sua integração com a API compartilhada.

## Problema e contexto

O BellaApp se destina à rotina de clínicas de estética. O problema que orienta o produto é a necessidade de organizar clientes, serviços, profissionais e atendimentos em um mesmo sistema, com controle de acesso e informações atualizadas.

Cadastros separados e agendas sem validação podem dificultar a consulta do histórico, gerar conflitos de horário e tornar pouco claro quem pode alterar informações. Estes são os problemas considerados no desenho da solução; não representam resultados de uma pesquisa de usuários já realizada.

## Público e objetivos

- Administradores: organizar o catálogo de serviços, a equipe e os cadastros da clínica.
- Profissionais: acessar as funcionalidades e os agendamentos permitidos pelo seu vínculo e pelas permissões da API.
- Clientes: são os destinatários dos atendimentos e possuem cadastro no sistema; o mobile atual não oferece uma área autenticada específica para o cliente final.

O objetivo é permitir a gestão da rotina pelo celular: cadastrar recursos, agendar atendimentos, consultar o dia e administrar a própria conta. A API aplica as regras e persiste os dados no MySQL por meio do Prisma. O aplicativo não acessa o banco diretamente.

## Histórico verificável

As datas abaixo vêm do histórico Git consultado. Descrevem marcos dos commits, não datas de lançamento, homologação ou aprovação por usuários.

| Data | Referência | Evolução registrada |
|---|---|---|
| 30/08/2026 | `b3d5e78` | Adição da tela de cadastro de contas. |
| 02/09/2026 | `e5d3f1d` | Adição das páginas de início e agenda. |
| 05/09/2026 | `d566bfd` | Criação das páginas de clientes e serviços. |
| 05/09/2026 | `13f8375` | Páginas de profissionais/perfil e trabalho de salvamento de imagens. |
| 07/09/2026 | `cd427b7` | Ajustes visuais nas telas de perfil, profissionais, clientes e serviços. |
| 08/09/2026 | `1ab5837` | Ajustes de design nas páginas do aplicativo. |

## Estado observado nesta revisão

Além dos marcos acima, o código de trabalho atual contém:

1. Cabeçalho com título da página, menu lateral na paleta rosa e botão central de ação na navegação inferior.
2. Início conectado aos cadastros e agendamentos reais, com saudação personalizada e seleção de data.
3. Operações de criação, consulta, edição e exclusão de clientes, serviços, profissionais e agendamentos, com restrições por permissão e estado do registro. Agendamentos concluídos permanecem somente para consulta no mobile.
4. Perfil com edição, foto e exclusão de conta.
5. Persistência do token de renovação com Expo SecureStore no Android/iOS; token de acesso e perfil permanecem em memória.
6. Restrição a HTTPS em produção, paginação compartilhada e validação de datas extraída para utilitário.
7. Testes de lógica do mobile e configuração unitária do backend sem reset do banco de integração.

Esta lista descreve implementação no código, inclusive alterações locais, e não certifica execução ponta a ponta em dispositivos.

## Decisões de arquitetura

- React Native/Expo para compartilhar a interface entre plataformas; Expo Router para rotas.
- Camada `services` para comunicação HTTP; componentes e telas não executam consultas SQL.
- Contextos para autenticação e ação da barra inferior; contratos em TypeScript com modo estrito.
- API como autoridade para permissões, vínculo com a clínica, validade do plano e conflitos de agendamento.
- Componentes reutilizados para formulários, detalhes e confirmação de exclusão.

## Validação e próximos marcos

Na etapa anterior foram executados com sucesso TypeScript, lint, quatro testes de lógica do mobile e 55 testes unitários do backend. Esses resultados são um registro da execução daquela etapa, não uma garantia permanente nem testes nativos.

Próximos marcos: demonstrar os CRUDs até o banco usando dados de teste; validar Android/iOS, acessibilidade e falhas de rede; analisar os avisos de dependências; produzir os diagramas acadêmicos ainda pendentes. Não há métricas coletadas de redução de conflitos, produtividade ou satisfação.

Consulte [requisitos e critérios de aceite](REQUISITOS.md) e [roteiro de validação](VALIDACAO.md).
