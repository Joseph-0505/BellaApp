# Diagramas de casos de uso

Os dois diagramas abaixo atendem ao mínimo solicitado e separam acesso/configuração de operação da clínica.

## Caso de uso 1 — acesso, onboarding e conta

[Baixar PNG](imagens/casos-de-uso/01-acesso-e-conta.png) · [Abrir SVG](imagens/casos-de-uso/01-acesso-e-conta.svg)

![Casos de uso de acesso e conta](imagens/casos-de-uso/01-acesso-e-conta.png)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Administrador" as Admin
actor "Profissional" as Prof
actor "Galeria do dispositivo" as Galeria

rectangle "BellaApp Mobile" {
  usecase "Criar conta" as UC1
  usecase "Entrar" as UC2
  usecase "Restaurar sessão" as UC3
  usecase "Renovar sessão" as UC4
  usecase "Sair" as UC5
  usecase "Concluir onboarding" as UC6
  usecase "Consultar perfil" as UC7
  usecase "Editar perfil" as UC8
  usecase "Gerenciar foto" as UC9
  usecase "Excluir conta" as UC10
  usecase "Validar dados" as UC11
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9
Admin --> UC10

Prof --> UC2
Prof --> UC3
Prof --> UC5
Prof --> UC7
Prof --> UC8
Prof --> UC9
Prof --> UC10

UC1 .> UC11 : <<include>>
UC2 .> UC11 : <<include>>
UC8 .> UC11 : <<include>>
UC10 .> UC11 : <<include>>
UC3 .> UC4 : <<include>>
Galeria --> UC9
@enduml
```

Observação: a conta profissional pode ser criada/ativada por convite no backend, porém essa ativação não possui tela no mobile atual.

## Caso de uso 2 — gestão da clínica e agenda

[Baixar PNG](imagens/casos-de-uso/02-gestao-e-agenda.png) · [Abrir SVG](imagens/casos-de-uso/02-gestao-e-agenda.svg)

![Casos de uso de gestão e agenda](imagens/casos-de-uso/02-gestao-e-agenda.png)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Administrador" as Admin
actor "Profissional" as Prof

rectangle "BellaApp Mobile" {
  usecase "Consultar painel" as UC1
  usecase "Consultar clientes" as UC2
  usecase "Manter clientes" as UC3
  usecase "Consultar serviços" as UC4
  usecase "Manter serviços" as UC5
  usecase "Consultar profissionais" as UC6
  usecase "Manter profissionais" as UC7
  usecase "Consultar agenda" as UC8
  usecase "Filtrar agenda por data" as UC9
  usecase "Filtrar por profissional" as UC10
  usecase "Criar agendamento" as UC11
  usecase "Editar/cancelar agendamento" as UC12
  usecase "Excluir agendamento" as UC13
  usecase "Validar vínculo e conflito" as UC14
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC11
Admin --> UC12
Admin --> UC13

Prof --> UC1
Prof --> UC2
Prof --> UC3
Prof --> UC4
Prof --> UC6
Prof --> UC8
Prof --> UC11
Prof --> UC12
Prof --> UC13

UC8 .> UC9 : <<include>>
UC10 .> UC8 : <<extend>>
UC11 .> UC14 : <<include>>
UC12 .> UC14 : <<include>>
@enduml
```

Restrições: o profissional só opera os próprios agendamentos conforme a API. Manutenção de serviços/profissionais é exclusiva do administrador. Um atendimento concluído permanece somente para consulta na interface atual.
