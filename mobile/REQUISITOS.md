# Requisitos do BellaApp Mobile

Revisão: 10/09/2026. Escopo: mobile e API necessária às suas funcionalidades.

**Implementado** significa que o fluxo foi localizado no código. **Parcial** significa que existem mecanismos, mas faltam cobertura ou evidências para garantir o requisito. Testes manuais e integração real pendentes não são tratados como aprovados.

## Requisitos funcionais

Os identificadores RF01–RF05 do README anterior foram preservados. Os demais detalham as funcionalidades acrescentadas.

| ID | Requisito e critério de aceite | Estado | Evidência principal |
|---|---|---|---|
| RF01 | Criar conta com nome, e-mail, CPF e senha. Campos inválidos devem impedir o envio ou receber rejeição da API; cadastro válido deve permitir login posterior. | Implementado | [Cadastro](src/app/cadastro/index.tsx), [autenticação](src/services/auth.ts) |
| RF02 | Autenticar, renovar e encerrar sessão. Após logout, rotas protegidas não devem ficar acessíveis. | Implementado | [AuthContext](src/context/AuthContext.tsx), [API](src/services/api.ts) |
| RF03 | Configurar a clínica no onboarding. Conta sem configuração concluída deve ser direcionada para essa etapa. | Implementado | [Onboarding](src/app/onboarding/index.tsx), [rotas](src/utils/routes.ts) |
| RF04 | Exibir no início totais reais e agendamentos da data escolhida; atualizar ao retornar à tela ou solicitar atualização. | Implementado | [Início](src/app/home/index.tsx) |
| RF05 | Consultar e editar o perfil autenticado, exibindo erros quando a API recusar alterações. | Implementado | [Perfil](src/app/perfil/index.tsx), [serviço de usuário](src/services/user.ts) |
| RF06 | Criar, listar, consultar detalhes, editar e excluir clientes. Exclusão deve exigir confirmação; edição deve refletir na próxima consulta. | Implementado | [Clientes](src/app/clientes/index.tsx), [API de clientes](src/services/clients.ts) |
| RF07 | Criar, consultar, editar e excluir serviços, incluindo nome, preço, duração e estado ativo/inativo, respeitando o acesso de administrador. | Implementado | [Serviços](src/app/servicos/index.tsx), [formulário](src/components/NewServiceModal/index.tsx) |
| RF08 | Criar, consultar, editar e excluir profissionais, incluindo especialidade, contato e estado ativo/inativo, conforme permissão de gestão. | Implementado | [Profissionais](src/app/profissionais/index.tsx), [formulário](src/components/NewProfessionalModal/index.tsx) |
| RF09 | Criar agendamento com cliente, serviço, profissional, data, horário e status; só apresentar sucesso após resposta da API. | Implementado | [Formulários de agenda](src/components/AppointmentModals/index.tsx), [serviço](src/services/appointments.ts) |
| RF10 | Consultar agenda por data/profissional e abrir detalhes completos ao tocar em um atendimento. Horários simultâneos devem continuar visíveis. | Implementado | [Agenda](src/app/agenda/agenda.tsx) |
| RF11 | Editar, cancelar pelo status e excluir agendamentos permitidos. No mobile, registros concluídos ficam sem ações de alteração/exclusão. | Implementado | [Agenda](src/app/agenda/agenda.tsx), [detalhes](src/components/AppointmentModals/index.tsx) |
| RF12 | Enviar, substituir e remover foto de perfil, solicitando permissão da galeria e apresentando erros de arquivo. | Implementado | [Perfil](src/app/perfil/index.tsx), [usuário](src/services/user.ts) |
| RF13 | Excluir a própria conta mediante confirmação e senha, respeitando as restrições de vínculo impostas pela API. | Implementado | [Exclusão de conta](src/components/DeleteAccountModal/index.tsx), [backend](../backend/src/modules/users/users.service.ts) |
| RF14 | Navegar pelo menu lateral e inferior e abrir a ação correspondente à página no botão central. Ações sem permissão não devem ser habilitadas. | Implementado | [Barra inferior](src/components/BottomNavigation/index.tsx), [contexto da ação](src/context/PageActionContext.tsx) |

Para considerar cada RF homologado: executar seu critério em uma conta de teste, registrar o resultado e, nas mutações, confirmar a persistência pelo backend/banco. Ter os endpoints ou a interface, isoladamente, não basta.

## Requisitos não funcionais

| ID | Requisito e critério verificável | Estado | Evidência e limite |
|---|---|---|---|
| RNF01 | Compatibilidade: executar os fluxos principais em Android e iOS sem bloqueios de navegação, teclado ou área segura. | Parcial | Expo e safe-area presentes; matriz de dispositivos ainda não executada. |
| RNF02 | Comunicação: usar API configurável por `EXPO_PUBLIC_API_URL`, sem acesso direto ao banco pelo mobile; exigir HTTPS em produção. | Implementado | [API](src/services/api.ts); implantação com certificado ainda precisa de verificação. |
| RNF03 | Validação: impedir submissão de dados obrigatórios/formato inválido e tratar rejeições do servidor. | Implementado nos formulários; validação integral pendente | Formulários e [validação de data](src/utils/appointment-date.ts); testar limites e regras de cada recurso. |
| RNF04 | Usabilidade de erros: apresentar erro compreensível e permitir correção/nova tentativa quando aplicável, sem apresentar gravação malsucedida como sucesso. | Parcial | [Tratamento de erros](src/utils/request-errors.ts); cenários offline e de atualização precisam de testes por tela. |
| RNF05 | Manutenibilidade: separar rotas, componentes, estado, contratos e acesso a dados; manter tipagem estrita e lint sem erros. | Parcial | [tsconfig](tsconfig.json), camadas em `src`; ainda existem estilos inline e lógica concentrada em telas. |
| RNF06 | Segurança da sessão: persistir somente o refresh token no armazenamento protegido nativo; excluir ao sair e impedir restauração tardia após logout. | Implementado; teste nativo pendente | [SecureStore](src/services/session-storage.ts), [sessão](src/services/api.ts). Navegador usa memória. |
| RNF07 | Autorização: rejeitar na API operações sem permissão e acesso fora da clínica; esconder botões não é controle suficiente. | Implementado no backend; integração pendente | [Contexto de acesso](../backend/src/shared/auth/user-clinic-context.ts), serviços do backend. |
| RNF08 | Integridade: validar vínculos e sobreposição de horários antes de persistir agendamentos; rejeições devem chegar ao formulário. | Implementado; ponta a ponta pendente | [Regras de agenda](../backend/src/modules/appointments/appointments.service.ts). |
| RNF09 | Acessibilidade: ações principais identificáveis por leitor de tela, estados selecionado/desabilitado anunciados e conteúdo utilizável com fonte ampliada. | Parcial | Há rótulos e estados acessíveis; auditoria TalkBack/VoiceOver e fonte ampliada pendente. |
| RNF10 | Escala de dados: início e agenda devem consultar todas as páginas necessárias sem truncar silenciosamente os dados na primeira página. | Parcial | [Paginação](src/services/pagination.ts) possui teste; desempenho com grande volume e paginação das demais telas precisam ser avaliados. Não foi medido SLA. |
| RNF11 | Qualidade: executar tipagem, lint e testes automatizados; registrar separadamente resultados manuais e integração real. | Parcial | [Testes mobile](tests/core.test.cjs), [configuração unitária](../backend/jest.unit.config.cjs), [validação](VALIDACAO.md). Sem testes automatizados de interface nativa. |
| RNF12 | Dependências: avaliar os avisos de segurança por pacote e impacto antes de publicar, registrando correções ou justificativas. | Pendente | A instalação anterior reportou alertas npm; não há evidência de triagem concluída. |

## Regras de negócio relacionadas

- Cadastro de conta: CPF válido, senha conforme validação e unicidade de e-mail/CPF verificada pelo servidor (RF01).
- Onboarding: direcionamento conforme estado da configuração (RF03).
- Gestão: permissões de administrador/profissional e vínculo com clínica aplicados pela API (RF07–RF11, RNF07).
- Agendamento: validar data e vínculos, considerar duração do serviço na verificação de conflitos e respeitar as transições permitidas (RF09–RF11, RNF08).
- Exclusão: pedir confirmação e respeitar a resposta da API. Não presumir que toda relação impede exclusão: o schema também contém relações com `Cascade` e `SetNull`, cujos efeitos devem ser verificados em dados de teste.

## Fora do escopo implementado e pendências documentais

Não são tratados como entregues: recuperação de senha no mobile, notificações push reais, operação offline com sincronização ou área exclusiva do cliente final. O botão de notificações atual não comprova um sistema de notificações.

DER e os dois diagramas de cada tipo (casos de uso, atividades e sequência) continuam pendentes. Estes requisitos documentados não substituem os diagramas solicitados na avaliação.
