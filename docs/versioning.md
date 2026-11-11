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

## Versões publicadas

| Tag | Commit em `main` | Data | Conteúdo |
|---|---|---|---|
| v1.1.0 | `061e3ac` (PR #10) | 2026-09-16 | API, web, mobile, Compose, Nginx com HTTPS, E2E e Husky |
| v1.2.0 | `9c10c60` (PR #13) | 2026-11-05 | cache-aside, Pub/Sub, health check, C4, DDD, ADRs e cenários de qualidade |
| v1.3.0 | `bffa2e4` (PR #16) | 2026-11-10 | notificações com Redis Streams, OpenAPI, CI/CD, SLOs, runbooks e Cynefin |
| v1.4.0 | merge do PR de promoção do branch `feature/KAN-45-ajustes-rubrica` | 2026-11-11 | OpenAPI completo, documentação consolidada, user stories e mapa da rubrica |

As tags v1.1.0, v1.2.0 e v1.3.0 foram criadas depois, sobre os commits de merge
reais que levaram cada entrega para `main`. Nenhum commit foi reescrito; a tag
apenas dá nome a um estado que já existia. O conteúdo de cada versão foi
conferido com `git ls-tree` antes da marcação.

A partir da v1.4.0, a tag é criada no momento do merge em `main`, seguindo o
fluxo acima.

## Comandos usados

```bash
git tag -a v1.1.0 061e3ac -m "BellaApp v1.1.0"
git tag -a v1.2.0 9c10c60 -m "BellaApp v1.2.0"
git tag -a v1.3.0 bffa2e4 -m "BellaApp v1.3.0"
git tag -a v1.4.0 <sha-do-merge> -m "BellaApp v1.4.0"
git push origin v1.1.0 v1.2.0 v1.3.0 v1.4.0
```

As notas de cada GitHub Release são a seção correspondente do `CHANGELOG.md`.

## Situação em 11/11/2026

As quatro tags e as quatro GitHub Releases estão publicadas, e as versões do
Jira foram liberadas na mesma data. As versões do Jira agrupam cards por tema e
não têm o mesmo conteúdo das tags de mesmo número. Detalhes em
[jira/status-2026-11-11.md](jira/status-2026-11-11.md).

