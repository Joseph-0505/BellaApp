# Diagramas de atividades

## Atividade 1 — login e direcionamento inicial

[Baixar PNG](imagens/atividades/01-login-e-direcionamento.png) · [Abrir SVG](imagens/atividades/01-login-e-direcionamento.svg)

![Atividade de login e direcionamento](imagens/atividades/01-login-e-direcionamento.png)

```plantuml
@startuml
|Usuário|
start
:Abrir o aplicativo;

|Mobile|
:Ler refresh token do SecureStore;
if (Existe token armazenado?) then (sim)
  :Solicitar renovação de sessão;
  |API|
  :Validar refresh token;
  if (Token válido?) then (sim)
    :Emitir access e refresh tokens;
    |Mobile|
    :Carregar perfil e status do onboarding;
  else (não)
    |Mobile|
    :Limpar sessão local;
    :Exibir login;
    |Usuário|
    :Informar e-mail e senha;
    |Mobile|
    :Validar campos e enviar credenciais;
    |API|
    :Autenticar usuário;
  endif
else (não)
  :Exibir login;
  |Usuário|
  :Informar e-mail e senha;
  |Mobile|
  :Validar campos e enviar credenciais;
  |API|
  :Autenticar usuário;
endif

|API|
if (Autenticação aceita?) then (sim)
  :Retornar sessão e perfil;
  |Mobile|
  :Consultar status do onboarding;
  if (Onboarding concluído?) then (sim)
    :Abrir início;
  else (não)
    :Abrir configuração inicial;
  endif
else (não)
  |Mobile|
  :Exibir erro de autenticação;
endif
stop
@enduml
```

## Atividade 2 — criar agendamento

[Baixar PNG](imagens/atividades/02-criar-agendamento.png) · [Abrir SVG](imagens/atividades/02-criar-agendamento.svg)

![Atividade de criação de agendamento](imagens/atividades/02-criar-agendamento.png)

```plantuml
@startuml
|Usuário|
start
:Abrir agenda e tocar em novo agendamento;
:Selecionar cliente, serviço e profissional;
:Informar data, horário, status e observações;
:Tocar em salvar;

|Mobile|
if (Campos obrigatórios e data são válidos?) then (sim)
  :Converter data local para ISO;
  :Enviar POST /api/v1/appointments;
else (não)
  :Exibir erro junto ao formulário;
  stop
endif

|API|
:Autenticar e identificar clínica/papel/plano;
if (Plano permite mutação?) then (sim)
  :Validar cliente, serviço e profissional da clínica;
else (não)
  :Responder erro de plano;
  |Mobile|
  :Manter formulário e exibir erro;
  stop
endif

|API|
if (Data é futura?) then (sim)
  :Calcular intervalo pela duração do serviço;
else (não)
  :Responder erro de data;
  |Mobile|
  :Manter formulário e exibir erro;
  stop
endif

|API|
if (Existe conflito de profissional ou sala?) then (sim)
  :Responder 409 TIME_CONFLICT;
  |Mobile|
  :Manter formulário e exibir conflito;
else (não)
  |Banco MySQL|
  :Persistir agendamento;
  |API|
  :Retornar agendamento criado;
  |Mobile|
  :Atualizar agenda e fechar modal;
endif
stop
@enduml
```
