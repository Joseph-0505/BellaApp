# BellaApp Mobile

Aplicativo mobile do BellaApp para a rotina de clinicas de estetica. O projeto usa React Native, Expo e Expo Router e consome a API Fastify do diretorio `../backend`.

## Funcionalidades atuais

- Criacao de conta com validacao de nome, e-mail, CPF e senha.
- Login com JWT, refresh de sessao e logout.
- Onboarding inicial para configurar o nome da clinica.
- Tela inicial com resumo da agenda e proximos atendimentos.
- Consulta e atualizacao do perfil autenticado.

O app ainda nao possui CRUD operacional de clientes, servicos ou agendamentos. Esses fluxos sao a proxima etapa funcional do mobile.

## Arquitetura

```text
src/app          rotas e telas do Expo Router
src/components   componentes reutilizaveis de interface
src/context      estado de autenticacao e onboarding
src/services     cliente HTTP e comunicacao com a API
src/types        contratos TypeScript
src/utils        formatacao, rotas e tratamento de erros
src/styles       estilos por tela
```

As rotas atuais sao `/`, `/login`, `/cadastro`, `/onboarding` e `/home`. Rotas protegidas usam o `AuthContext`; apos login, o usuario segue para o onboarding ou para a tela inicial conforme o status retornado pela API.

## Requisitos funcionais atendidos

- RF01: criar conta com dados pessoais e senha forte.
- RF02: autenticar e encerrar sessao.
- RF03: concluir configuracao inicial da clinica.
- RF04: visualizar dados resumidos da agenda.
- RF05: visualizar e atualizar o perfil autenticado.

## Requisitos nao funcionais

- RNF01: o app deve funcionar em Android e iOS via Expo.
- RNF02: a comunicacao deve ocorrer por API HTTP configuravel.
- RNF03: entradas de cadastro devem ser validadas antes do envio.
- RNF04: erros da API devem ser apresentados em linguagem compreensivel.
- RNF05: o codigo deve manter separacao entre telas, componentes, estado e acesso a dados.

## Regras de negocio

- CPF deve possuir 11 digitos e digitos verificadores validos.
- Senha deve ter ao menos 8 caracteres, letra maiuscula, minuscula, numero e simbolo.
- E-mail e CPF nao podem duplicar um cadastro existente; a API aplica essa regra de forma definitiva.
- Apos criar a conta, o app retorna ao login e preenche o e-mail informado. A sessao so e criada apos a pessoa informar as credenciais na tela de login.
- O onboarding e obrigatorio antes da area autenticada principal.

## Integracao com a API

Por padrao, o app identifica o host do Expo Go e usa a porta `3000`. No emulador Android sem Expo Go, o fallback e `http://10.0.2.2:3000`.

Para definir outra API, configure antes de iniciar o Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://SEU_IP:3000"
npm start
```

Com o emulador, inicie tambem o backend e o MySQL. O banco precisa estar com as migrations aplicadas:

```powershell
cd ..\backend
npx prisma migrate deploy
npm run dev
```

## Execucao local

```powershell
cd mobile
npm install
npm run android
```

Caso a porta 8081 ja esteja ocupada, aceite a porta alternativa oferecida pelo Expo. Para verificar qualidade estatica:

```powershell
npm run lint
npx tsc --noEmit
```

## Seguranca e limites atuais

- A API usa JWT e valida as credenciais no backend; senhas nao sao armazenadas pelo app.
- A sessao mobile permanece apenas em memoria nesta versao. Persistencia segura com `expo-secure-store` ainda deve ser implementada.
- Recuperacao de senha, upload de imagens e CRUD mobile de clientes, servicos e agenda ainda nao foram conectados.
