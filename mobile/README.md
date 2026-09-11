# BellaApp Mobile

Aplicativo para a rotina de clínicas de estética, desenvolvido com React Native, Expo e Expo Router. Consome a API Fastify de `../backend`, que persiste os dados no MySQL por meio do Prisma.

## Documentação do produto

- [Contexto, objetivos e evolução](EVOLUCAO.md).
- [Requisitos funcionais, não funcionais e critérios de aceite](REQUISITOS.md).
- [Verificações e roteiro de validação](VALIDACAO.md).

Os documentos distinguem implementação no código de homologação em dispositivos e no banco.

## Funcionalidades atuais

- Cadastro de conta, login, renovação da sessão e logout.
- Onboarding da clínica.
- Início com totais reais de cadastros e agenda por data.
- CRUD de clientes, serviços e profissionais, conforme permissões.
- Criação, detalhes, edição e exclusão de agendamentos permitidos; cancelamento por status e filtro por profissional. Agendamentos concluídos ficam somente para consulta no mobile.
- Consulta e edição de perfil, envio/remoção de foto e exclusão da própria conta.
- Menu lateral, navegação inferior e ação central contextual.
- Persistência do refresh token com Expo SecureStore no Android/iOS.

## Arquitetura

| Diretório | Responsabilidade |
|---|---|
| `src/app` | Rotas e telas |
| `src/components` | Componentes, formulários e detalhes |
| `src/context` | Autenticação, onboarding e ação central |
| `src/hooks` | Hooks compartilhados |
| `src/services` | Comunicação com API, paginação e armazenamento da sessão |
| `src/types` | Contratos TypeScript |
| `src/utils` | Formatação, validação, rotas e erros |
| `src/styles`, `src/global` | Estilos e paleta visual |
| `tests` | Testes automatizados de lógica |

Rotas: `/`, `/login`, `/cadastro`, `/onboarding`, `/home`, `/agenda`, `/clientes`, `/servicos`, `/profissionais` e `/perfil`.

O aplicativo verifica autenticação e onboarding para direcionar a navegação. A autorização efetiva das operações pertence ao backend.

## Execução local

Na pasta `mobile`:

```powershell
npm install
$env:EXPO_PUBLIC_API_URL = "http://SEU_IP:3000"
npm start
```

O backend e o MySQL devem estar disponíveis e com as migrations aplicadas. Sem URL explícita, o aplicativo identifica o host do Expo; no emulador Android local, usa `http://10.0.2.2:3000` quando aplicável.

Também estão disponíveis `npm run android`, `npm run ios` (com ambiente iOS compatível) e `npm run web`. Builds nativas precisam incluir Expo SecureStore; atualizar apenas JavaScript não adiciona módulos a uma build antiga.

## Qualidade e testes

```powershell
npm test
npx tsc --noEmit
npm run lint
```

Na pasta `backend`, para testes unitários sem reset do banco:

```powershell
node node_modules/jest/bin/jest.js --config=jest.unit.config.cjs --runInBand
```

Não confundir esses testes com homologação de interface, segurança completa ou CRUD real no banco. A configuração padrão de integração do backend recria o banco de testes; consulte o setup antes de executá-la.

## Segurança e limites

- Produção exige `EXPO_PUBLIC_API_URL` com HTTPS; HTTP local é permitido no desenvolvimento.
- Senhas não são persistidas pelo aplicativo. No nativo, apenas o refresh token é guardado no SecureStore; perfil e access token ficam em memória.
- No navegador, a sessão permanece em memória.
- Permissões, conflitos de agenda e restrições de plano são verificados pela API.
- Recuperação de senha, notificações push reais e sincronização offline não estão implementadas no mobile.
- Testes Android/iOS, integração com banco e análise dos avisos de dependências continuam pendentes. Consulte [VALIDACAO.md](VALIDACAO.md).
