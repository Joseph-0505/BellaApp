# Requisitos e auditoria de implementação

Revisão: 14/09/2026.

## Critério de estado

- **Implementado:** o fluxo completo foi localizado no código do mobile e nos endpoints necessários.
- **Parcial:** existe implementação, mas falta uma parte relevante ou validação em ambiente real.
- **Não implementado:** não foi localizado um fluxo funcional no mobile.

Esses estados não substituem homologação. Testes manuais, persistência real e comportamento em aparelhos permanecem separados.

## Requisitos funcionais

| ID | Requisito verificável | Estado | Evidência principal |
|---|---|---|---|
| RF01 | Criar conta com nome, e-mail, CPF, senha e confirmação; impedir envio local inválido e tratar a rejeição da API. | Implementado | `src/app/cadastro/index.tsx`, `src/services/auth.ts` |
| RF02 | Entrar, renovar a sessão, restaurá-la no nativo e sair; uma resposta 401 deve tentar renovação uma vez ou limpar a sessão. | Implementado | `src/context/AuthContext.tsx`, `src/services/api.ts`, `src/services/session-storage.ts` |
| RF03 | Consultar o estado do onboarding, exigir nome da clínica e direcionar a conta incompleta para a configuração inicial. | Implementado | `src/app/index.tsx`, `src/app/onboarding/index.tsx`, `src/services/onboarding.ts` |
| RF04 | Mostrar totais de clientes, serviços ativos, profissionais ativos e agenda; atualizar ao focar/puxar a tela e permitir troca da data. | Implementado | `src/app/home/index.tsx` |
| RF05 | Criar, pesquisar, filtrar, consultar detalhes, editar e excluir clientes com confirmação. | Implementado | `src/app/clientes/index.tsx`, `src/components/ClientDetailsModal`, `src/services/clients.ts` |
| RF06 | Listar e filtrar serviços; permitir ao administrador criar, editar, ativar/desativar e excluir. | Implementado | `src/app/servicos/index.tsx`, `src/components/NewServiceModal`, `src/services/services.ts` |
| RF07 | Listar e filtrar profissionais; permitir ao administrador criar, editar, ativar/desativar e excluir conforme regras do plano. | Implementado | `src/app/profissionais/index.tsx`, `src/components/NewProfessionalModal`, `src/services/professionals.ts` |
| RF08 | Consultar a agenda por semana/data e filtrar por profissional, preservando múltiplos registros no mesmo horário. | Implementado | `src/app/agenda/agenda.tsx`, `src/services/appointments.ts` |
| RF09 | Criar e editar agendamento com cliente, serviço, profissional, data, hora, status e observações; mostrar sucesso somente após a API aceitar. | Implementado | `src/components/AppointmentModals/index.tsx`, `src/services/appointments.ts` |
| RF10 | Cancelar pelo status e excluir agendamentos permitidos; manter atendimento concluído somente para consulta no mobile. | Implementado | `src/app/agenda/agenda.tsx`, `backend/src/modules/appointments/appointments.service.ts` |
| RF11 | Consultar e editar o perfil do usuário autenticado. | Implementado | `src/app/perfil/index.tsx`, `src/components/EditProfileModal`, `src/services/user.ts` |
| RF12 | Solicitar acesso à galeria, enviar/substituir/remover foto de perfil e tratar erros. | Implementado | `src/app/perfil/index.tsx`, `src/services/user.ts` |
| RF13 | Excluir a própria conta mediante confirmação textual e senha. | Implementado | `src/components/DeleteAccountModal`, `src/services/user.ts` |
| RF14 | Navegar por menu lateral/inferior e expor uma ação contextual apenas quando habilitada. | Implementado | `src/components/HomeHeader`, `src/components/BottomNavigation`, `src/context/PageActionContext.tsx` |

## Requisitos não funcionais

| ID | Requisito verificável | Estado | Evidência ou pendência |
|---|---|---|---|
| RNF01 | Executar os fluxos principais em Android e iOS sem bloqueios de teclado, navegação ou área segura. | Parcial | Expo e Safe Area estão configurados; não há matriz de homologação preenchida. |
| RNF02 | Usar API configurável, sem SQL no mobile, e exigir HTTPS fora do desenvolvimento. | Implementado | `src/services/api.ts` resolve `EXPO_PUBLIC_API_URL` e rejeita HTTP em produção. |
| RNF03 | Manter senha fora do armazenamento e guardar somente refresh token no armazenamento nativo protegido. | Implementado; teste nativo pendente | `src/services/session-storage.ts`; no navegador a sessão não é persistida. |
| RNF04 | Aplicar autenticação, escopo de clínica, papéis e propriedade do agendamento no servidor. | Implementado no backend; E2E pendente | `backend/src/shared/auth/user-clinic-context.ts` e serviços dos módulos. |
| RNF05 | Validar obrigatoriedade/formato no formulário e regras de integridade na API. | Parcial | Há validações locais e no servidor; faltam testes sistemáticos de todos os limites. |
| RNF06 | Informar erros compreensíveis e oferecer nova tentativa quando aplicável. | Parcial | `src/utils/request-errors.ts` e recarga em telas; cenários offline não foram homologados. |
| RNF07 | Separar interface, contexto, serviços, tipos e utilitários; manter TypeScript estrito e lint limpo. | Implementado com dívida técnica | Verificação passou, mas algumas telas concentram lógica e estilos inline. |
| RNF08 | Impedir conflito de agenda considerando data, profissional/sala e duração do serviço. | Implementado no backend; E2E pendente | `backend/src/modules/appointments/appointments.service.ts`. |
| RNF09 | Suportar leitor de tela, estados selecionado/desabilitado e fonte ampliada. | Parcial | Há rótulos em ações centrais; auditoria TalkBack/VoiceOver não foi executada. |
| RNF10 | Não truncar silenciosamente dados necessários ao início e à agenda. | Implementado nesses fluxos | `src/services/pagination.ts`; listas de gestão ainda trabalham com até 100 registros por consulta. |
| RNF11 | Possuir verificações automatizadas de lógica, tipagem e lint. | Parcial | 4 testes passaram, TypeScript e lint passaram; não há teste automatizado de UI nativa. |
| RNF12 | Manter desempenho aceitável com volume real e registrar uma meta mensurável. | Pendente | Não existe SLA nem teste de carga/renderização no mobile. |

## Regras de negócio confirmadas

- E-mail do usuário e CPF, quando informado, devem ser únicos segundo o banco/API.
- Todo dado operacional pertence a uma clínica; a API filtra pelo vínculo do usuário.
- Somente administrador gerencia serviços e profissionais.
- O plano pode limitar a criação de profissionais; TRIAL e INDIVIDUAL permitem no máximo um profissional cadastrado por clínica segundo a regra atual do backend.
- Profissional autenticado fica restrito aos próprios agendamentos nas operações protegidas.
- Novo agendamento exige profissional e data futura.
- Conflitos consideram a duração do serviço e apenas registros `SCHEDULED` ou `CONFIRMED`. Quando há sala, ela define o escopo da busca; sem sala, o escopo é o profissional.
- Atendimento concluído não pode voltar a outro status; se houver cobrança, não pode ser excluído.
- Cliente, serviço, profissional e sala usados pelo agendamento precisam pertencer à mesma clínica.

## Lacunas encontradas

| Funcionalidade presente em algum nível | Situação no mobile |
|---|---|
| Notificações | Não implementada; o botão atual abre um alerta fixo. |
| Salas | O modelo/API existem e o agendamento preserva `roomId`, mas não há gestão nem escolha de sala no formulário mobile. |
| Cobranças e caixa | Modelos e endpoints existem no backend, sem telas/serviços no mobile. |
| Convite/ativação de profissional | Endpoints existem no backend, sem fluxo mobile. |
| Concluir atendimento | Endpoint e regra existem no backend, mas o seletor do mobile não oferece `COMPLETED`. |
| Recuperar senha | Não localizada no mobile nem nas rotas de autenticação examinadas. |
| Offline/sincronização | Não implementado. |

## Evidência das verificações automatizadas

Executado na pasta `mobile` em 14/09/2026:

| Comando | Resultado |
|---|---|
| `npm test` | 4 aprovados, 0 falhas |
| `npx tsc --noEmit` | concluído sem erros |
| `npm run lint` | concluído sem erros |

Ainda é necessário executar cadastro, CRUDs, permissões, conflitos, restauração de sessão, foto e exclusão de conta em ambiente de homologação com API e MySQL.
