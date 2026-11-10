# Versionamento e releases

Relacionado a KAN-43, KAN-44 e KAN-45.

## Padrão

O BellaApp usa [Semantic Versioning](https://semver.org/):

- `MAJOR`: mudança incompatível na API ou no comportamento público;
- `MINOR`: funcionalidade compatível adicionada;
- `PATCH`: correção compatível, sem nova funcionalidade pública.

Tags Git usam `vMAJOR.MINOR.PATCH`, por exemplo `v1.2.0`. Versões planejadas no
Jira podem ter um sufixo descritivo, mas a tag e o título da release usam somente
o identificador SemVer.

## CHANGELOG

O arquivo `CHANGELOG.md` segue Keep a Changelog. Mudanças entram primeiro em
`Unreleased`, agrupadas em `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed` e
`Security`. Na publicação, a seção é renomeada para a versão e a data ISO.

## Fluxo de release

1. Confirmar que os cards da versão estão concluídos e associados à versão Jira.
2. Atualizar `CHANGELOG.md` e versões dos pacotes aplicáveis.
3. Executar testes, builds e `docker compose config --quiet`.
4. Mesclar o PR em `main`.
5. Criar tag anotada: `git tag -a v1.2.0 -m "BellaApp v1.2.0"`.
6. Enviar a tag: `git push origin v1.2.0`.
7. Criar uma GitHub Release a partir da tag, usando o CHANGELOG como notas.
8. Marcar a versão correspondente como lançada no Jira e anexar a URL da release.

Tags e releases são artefatos públicos e não devem ser simulados. Uma versão só é
considerada fechada depois de tag, GitHub Release e versão Jira liberada existirem.

## Plano parcial

| Versão Jira | Conteúdo | Condição de liberação |
|---|---|---|
| v1.1.0 Fundação | arquitetura, Compose, Nginx, Cynefin e backlog | stack reproduzível e documentação revisada |
| v1.2.0 Cache e eventos | cache-aside e Pub/Sub | testes de isolamento, invalidação, fail-open e consumo |
| v1.3.0 Qualidade e API | OpenAPI, SLOs e resiliência | contrato e cenários de falha validados |
| v1.4.0 Entrega | CI/CD, runbooks e gestão | pipeline aprovado e evidências consolidadas |

KAN-45 permanece dependente da publicação real de pelo menos duas tags e releases.

