# Contextualização do problema e evolução do produto

Revisão: 14/09/2026.

## Contexto do problema

Clínicas de estética precisam coordenar clientes, catálogo de serviços, profissionais e horários. Quando esses dados ficam em planilhas, agendas pessoais ou conversas dispersas, aumenta o risco de duplicidade, perda de histórico, dificuldade para localizar informações e conflito de horários.

O BellaApp centraliza essa rotina em um aplicativo mobile. A interface permite que pessoas vinculadas a uma clínica consultem e alterem os dados autorizados; a API valida identidade, clínica, papel do usuário, plano e regras de agenda antes de persistir os dados no MySQL.

Esta contextualização descreve o problema que guiou o produto. Ela não deve ser apresentada como resultado de pesquisa quantitativa ou entrevistas, pois essas evidências não existem no repositório.

## Público e atores

- **Administrador da clínica:** configura a clínica, mantém clientes, serviços e profissionais, administra agendamentos e a própria conta.
- **Profissional:** acessa a clínica por vínculo e trabalha apenas com os agendamentos permitidos pela API. Pode consultar catálogos, mas não gerenciar serviços ou profissionais.
- **Cliente da clínica:** é uma entidade cadastrada e destinatária do atendimento; não possui uma área autenticada no aplicativo atual.

## Objetivo do produto

Permitir que a operação básica da clínica seja administrada pelo celular: criar uma conta, configurar a clínica, manter cadastros, acompanhar indicadores, organizar a agenda e gerenciar o perfil. O mobile não acessa o banco diretamente; toda persistência passa pela API.

## Limites atuais

Estão fora do mobile atual que futuramente serão integrados:

- recuperação de senha;
- notificações push reais — o sino exibe apenas uma mensagem local;
- funcionamento offline com sincronização;
- área autenticada para o cliente final;
- telas de salas, cobranças e caixa, apesar de esses módulos existirem no backend;
- ativação de convite de profissional pelo aplicativo;
- ação de concluir atendimento pelo mobile.

## Visão da solução

1. O aplicativo Expo Router controla rotas e telas.
2. contextos React mantêm sessão, estado de onboarding e ação contextual.
3. a camada `src/services` monta as requisições HTTP e trata renovação de token.
4. a API Fastify autentica, autoriza e aplica as regras de negócio.
5. o Prisma persiste o modelo relacional no MySQL.

## Evolução verificável

As datas abaixo correspondem a commits do Git, não a lançamentos em produção.

| Data       | Commit    | Evolução registrada                                            |
| ---------- | --------- | -------------------------------------------------------------- |
| 23/08/2026 | `befea72` | Telas iniciais de login e cadastro.                            |
| 30/08/2026 | `b3d5e78` | Implementação da tela de cadastro de conta.                    |
| 02/09/2026 | `e5d3f1d` | Criação das páginas de início e agenda.                        |
| 05/09/2026 | `d566bfd` | Criação das páginas de clientes e serviços.                    |
| 05/09/2026 | `13f8375` | Páginas de profissionais/perfil e trabalho com imagens.        |
| 07/09/2026 | `cd427b7` | Ajustes visuais em perfil, profissionais, clientes e serviços. |
| 08/09/2026 | `1ab5837` | Ajustes gerais de design.                                      |
| 10/09/2026 | `6eacc2e` | Implementação de CRUDs e atualização da documentação.          |

## Estado encontrado em 14/09/2026

- Cadastro, login, renovação de sessão, restauração nativa e logout.
- Redirecionamento obrigatório para o onboarding enquanto a clínica não está configurada.
- Início com totais dos cadastros e agendamentos por data.
- Criação, listagem, detalhes, edição e exclusão de clientes.
- CRUD de serviços e profissionais para administradores; leitura para profissionais.
- Agenda por data e profissional, com criação, edição, cancelamento por status e exclusão. A API valida data futura, vínculo e conflito por duração.
- Consulta/edição de perfil, inclusão/remoção de foto e exclusão da conta.
- Refresh token no Expo SecureStore no Android/iOS; access token e perfil em memória.
- Navegação lateral, inferior e botão contextual central.

## Próximos marcos recomendados

1. Homologar os fluxos em Android e iOS usando uma clínica de teste.
2. Automatizar testes de interface e integração mobile–API.
3. Definir se salas, cobranças, caixa, convites e conclusão de atendimento entrarão no escopo do mobile.
4. Medir desempenho e paginação com volumes maiores de dados.
