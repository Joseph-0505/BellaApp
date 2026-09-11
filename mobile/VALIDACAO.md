# Validação do mobile

Documentos relacionados: [evolução do produto](EVOLUCAO.md) e [requisitos e critérios de aceite](REQUISITOS.md).

## Implementado

- Clientes: criar, consultar, editar e excluir, com confirmação e erro da API.
- Serviços e profissionais: edição/exclusão disponíveis conforme permissões; formulários preservam os dados existentes e permitem alterar ativo/inativo.
- Agendamentos: criar, consultar, editar e excluir; atendimentos concluídos ficam somente para consulta no mobile. A API continua responsável pelas regras de conflito, plano e acesso.
- Sessão nativa: somente refresh token no Expo SecureStore; acesso e perfil em memória. No navegador, a sessão permanece em memória.
- Produção: API deve usar HTTPS, configurada por EXPO_PUBLIC_API_URL. HTTP local continua permitido no desenvolvimento.
- Paginação compartilhada entre início e agenda; validação de data extraída para utilitário testável.

## Verificações automatizadas

Na pasta mobile: `npm test`, `npx tsc --noEmit` e `npm run lint`.

Na pasta backend: `node node_modules/jest/bin/jest.js --config=jest.unit.config.cjs --runInBand`.

A configuração unitária não executa o reset de banco da configuração de integração. Os testes unitários usam mocks e não comprovam persistência real nem renderização nativa.

## Validação manual pendente

Usar contas e registros de teste, em Android e iOS. Registrar dispositivo, versão do sistema, resultado e evidência de cada caso:

1. Criar cliente, abrir detalhes, editar, recarregar e verificar os dados no banco; excluir e verificar remoção no banco. Não usar dados reais.
2. Repetir para serviços/profissionais. Verificar permissões e os efeitos de exclusão sobre registros vinculados conforme a API e o schema (incluindo cascatas e vínculos anulados); não presumir bloqueio universal.
3. Criar agendamento; confirmar data/horário local; editar e cancelar. Tentar sobreposição de horários, datas passadas e acesso a dados de outra clínica; conferir rejeição da API.
4. Fechar completamente o aplicativo e reabrir: validar restauração de sessão. Fazer logout, fechar e reabrir: permanecer deslogado. Validar token expirado e indisponibilidade da rede.
5. Testar formulários com teclado aberto, fonte ampliada, leitor de tela, tela pequena, tablet e botão voltar do Android.
6. Validar a versão de produção com HTTPS e acesso às fotos; instalar uma nova build caso a build anterior não inclua Expo SecureStore.

Não considerar estes testes manuais aprovados antes de executá-los. A instalação das dependências reportou avisos de vulnerabilidade do npm; requerem triagem separada por pacote e impacto antes da publicação.
