# Diagramas de sequência

## Sequência 1 — login, onboarding e restauração de sessão

[Baixar PNG](imagens/sequencia/01-login-e-sessao.png) · [Abrir SVG](imagens/sequencia/01-login-e-sessao.svg)

![Sequência de login e restauração de sessão](imagens/sequencia/01-login-e-sessao.png)

```plantuml
@startuml
actor Usuario
participant "App mobile" as App
participant "AuthContext" as Context
participant "Camada API" as ApiClient
participant "API Fastify" as API
database "MySQL/Prisma" as DB
collections "SecureStore" as Store

Usuario -> App: informa e-mail e senha
App -> Context: signIn(credenciais)
Context -> ApiClient: loginAndStoreSession()
ApiClient -> API: POST /api/v1/auth/login
API -> DB: buscar usuário e validar senha
DB --> API: usuário e vínculos
API --> ApiClient: access token, refresh token e perfil
ApiClient -> Store: persistir refresh token
ApiClient --> Context: sessão
Context -> API: GET /api/v1/users/me
Context -> API: GET /api/v1/onboarding/status
API -> DB: consultar perfil, clínica e onboarding
DB --> API: dados
API --> Context: perfil e status
alt onboarding concluído
  Context --> App: direcionar para /home
else onboarding pendente
  Context --> App: direcionar para /onboarding
end

== Próxima abertura do aplicativo ==
App -> Store: ler refresh token
Store --> App: refresh token
App -> API: POST /api/v1/auth/refresh
API -> DB: validar token e usuário
DB --> API: sessão válida
API --> App: novos tokens e perfil
App -> Store: substituir refresh token
@enduml
```

## Sequência 2 — criação de agendamento com conflito alternativo

[Baixar PNG](imagens/sequencia/02-criar-agendamento.png) · [Abrir SVG](imagens/sequencia/02-criar-agendamento.svg)

![Sequência de criação de agendamento](imagens/sequencia/02-criar-agendamento.png)

```plantuml
@startuml
actor Usuario
participant "Tela de agenda" as Tela
participant "AppointmentModal" as Modal
participant "appointments.ts" as Service
participant "API Fastify" as API
participant "AppointmentService" as Domain
database "MySQL/Prisma" as DB

Usuario -> Tela: toca em novo agendamento
Tela -> Modal: abrir(data, catálogos)
Usuario -> Modal: seleciona dados e salva
Modal -> Modal: validar obrigatórios e data/hora

alt dados locais inválidos
  Modal --> Usuario: exibir erro e manter formulário
else dados locais válidos
  Modal -> Service: createAppointment(payload)
  Service -> API: POST /api/v1/appointments + Bearer token
  API -> Domain: create(userId, payload)
  Domain -> DB: buscar clínica, papel, plano e relações
  DB --> Domain: contexto, cliente, serviço, profissional e sala
  Domain -> Domain: validar data futura e duração
  Domain -> DB: buscar agenda do dia
  DB --> Domain: agendamentos existentes
  Domain -> Domain: verificar sobreposição

  alt há conflito
    Domain --> API: erro 409 TIME_CONFLICT
    API --> Service: resposta de erro
    Service --> Modal: ApiError
    Modal --> Usuario: informar conflito e manter formulário
  else horário disponível
    Domain -> DB: INSERT Appointment
    DB --> Domain: agendamento persistido
    Domain --> API: agendamento criado
    API --> Service: 201/200 + dados
    Service --> Modal: Appointment
    Modal --> Tela: onSubmit concluído
    Tela -> Tela: atualizar estado e data selecionada
    Modal --> Usuario: fechar formulário e mostrar agenda
  end
end
@enduml
```
