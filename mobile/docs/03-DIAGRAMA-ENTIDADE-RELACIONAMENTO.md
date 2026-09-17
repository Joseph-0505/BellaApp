# Diagrama entidade-relacionamento

## Escopo

O aplicativo mobile não possui banco relacional próprio. O DER representa as entidades persistidas pela API que sustentam os fluxos do mobile. Campos de auditoria (`createdAt` e `updatedAt`) foram omitidos do desenho para manter a leitura; eles existem no schema Prisma.

## DER principal — núcleo usado pelo mobile

[Baixar PNG](imagens/der/01-nucleo-mobile.png) · [Abrir SVG](imagens/der/01-nucleo-mobile.svg)

![DER principal do BellaApp](imagens/der/01-nucleo-mobile.png)

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string cpf UK
        string avatarFileName
        boolean admin
        enum plan
    }

    CLINIC {
        string id PK
        enum plan
        datetime trialEndsAt
    }

    CLINIC_USER {
        string id PK
        string clinicId FK
        string userId FK
        string professionalId FK, UK
        enum role
    }

    BUSINESS_PROFILE {
        string id PK
        string userId FK, UK
        string clinicId FK, UK
        string businessName
        string cnpj UK
        boolean hasTeam
        boolean usesRooms
        datetime onboardingCompletedAt
    }

    CLIENT {
        string id PK
        string userId FK
        string clinicId FK
        string name
        string email
        string phone
        string cpf
        string notes
    }

    SERVICE {
        string id PK
        string userId FK
        string clinicId FK
        string name
        decimal price
        int durationMinutes
        enum riskLevel
        boolean active
    }

    PROFESSIONAL {
        string id PK
        string userId FK
        string clinicId FK
        string name
        string specialty
        string email
        string phone
        boolean status
    }

    ROOM {
        string id PK
        string userId FK
        string clinicId FK
        string name
        string color
        boolean active
    }

    APPOINTMENT {
        string id PK
        string userId FK
        string clinicId FK
        string clientId FK
        string serviceId FK
        string professionalId FK
        string roomId FK
        datetime scheduledAt
        enum status
        enum receivedBy
        string notes
    }

    REFRESH_TOKEN {
        string id PK
        string userId FK
        string token UK
        datetime expiresAt
    }

    USER ||--o| BUSINESS_PROFILE : possui
    CLINIC o|--o| BUSINESS_PROFILE : identifica
    USER ||--o{ CLINIC_USER : participa
    CLINIC ||--o{ CLINIC_USER : agrega
    PROFESSIONAL o|--o| CLINIC_USER : vincula_acesso
    USER ||--o{ REFRESH_TOKEN : autentica

    USER ||--o{ CLIENT : criou
    USER ||--o{ SERVICE : criou
    USER ||--o{ PROFESSIONAL : criou
    USER ||--o{ ROOM : criou
    USER ||--o{ APPOINTMENT : criou

    CLINIC ||--o{ CLIENT : possui
    CLINIC ||--o{ SERVICE : oferece
    CLINIC ||--o{ PROFESSIONAL : possui
    CLINIC ||--o{ ROOM : possui
    CLINIC ||--o{ APPOINTMENT : possui

    CLIENT ||--o{ APPOINTMENT : recebe
    SERVICE ||--o{ APPOINTMENT : define
    PROFESSIONAL o|--o{ APPOINTMENT : executa
    ROOM o|--o{ APPOINTMENT : aloca
```

## Cardinalidades e regras importantes

- Um usuário pode integrar mais de uma clínica pelo modelo, mas cada vínculo `ClinicUser` liga exatamente um usuário a uma clínica.
- `professionalId` em `ClinicUser` é opcional e único; ele associa uma conta com papel profissional ao seu cadastro operacional.
- Cada cliente, serviço, profissional, sala e agendamento pertence obrigatoriamente a uma clínica.
- Todo agendamento possui cliente e serviço; profissional e sala são opcionais no schema. A regra atual da API torna o profissional obrigatório ao criar/editar.
- CPF do cliente é único dentro da clínica; e-mail e CPF do usuário são únicos globalmente.
- O mobile usa `RefreshToken` para restaurar a sessão nativa, mas guarda no aparelho apenas o valor do token, não esta entidade completa.

## Extensão do banco ainda sem interface mobile

[Baixar PNG](imagens/der/02-extensao-financeira.png) · [Abrir SVG](imagens/der/02-extensao-financeira.svg)

![DER da extensão financeira](imagens/der/02-extensao-financeira.png)

O schema também possui faturamento e caixa. O desenho abaixo registra o modelo real, mas não deve ser apresentado como funcionalidade entregue no aplicativo.

```mermaid
erDiagram
    USER ||--o{ BILLING : criou
    CLINIC ||--o{ BILLING : possui
    APPOINTMENT o|--o| BILLING : origina

    USER ||--o{ CASH_REGISTER : abriu
    CLINIC ||--o{ CASH_REGISTER : possui
    PROFESSIONAL o|--o{ CASH_REGISTER : delimita

    USER ||--o{ CASH_MOVEMENT : criou
    CLINIC ||--o{ CASH_MOVEMENT : possui
    PROFESSIONAL o|--o{ CASH_MOVEMENT : recebe
    BILLING o|--o{ CASH_MOVEMENT : liquida
    CASH_REGISTER o|--o{ CASH_MOVEMENT : agrupa

    BILLING {
        string id PK
        string appointmentId FK, UK
        decimal amount
        decimal paidAmount
        decimal remainingAmount
        enum status
        enum receivedBy
    }

    CASH_REGISTER {
        string id PK
        string professionalId FK
        date registerDate
        enum status
        decimal openingAmount
        decimal totalBalanceSnapshot
    }

    CASH_MOVEMENT {
        string id PK
        string professionalId FK
        string billingId FK
        string cashRegisterId FK
        enum type
        enum status
        enum paymentMethod
        decimal amount
        datetime occurredAt
    }
```

Fonte de verdade: `backend/prisma/schema.prisma`.
