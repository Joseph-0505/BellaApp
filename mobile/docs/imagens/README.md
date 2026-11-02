# Imagens dos diagramas

Oito diagramas renderizados a partir dos blocos Mermaid/PlantUML dos documentos 03 a 06. PNG é adequado para enviar ou inserir em trabalhos; SVG permite ampliar e imprimir sem perda de nitidez. As fontes `.mmd` e `.puml` exportadas estão ao lado das imagens.

| Tipo | Diagrama | PNG | SVG |
|---|---|---|---|
| DER | Núcleo mobile | [PNG](der/01-nucleo-mobile.png) | [SVG](der/01-nucleo-mobile.svg) |
| DER | Extensão financeira do backend | [PNG](der/02-extensao-financeira.png) | [SVG](der/02-extensao-financeira.svg) |
| Casos de uso | Acesso e conta | [PNG](casos-de-uso/01-acesso-e-conta.png) | [SVG](casos-de-uso/01-acesso-e-conta.svg) |
| Casos de uso | Gestão e agenda | [PNG](casos-de-uso/02-gestao-e-agenda.png) | [SVG](casos-de-uso/02-gestao-e-agenda.svg) |
| Atividades | Login e direcionamento | [PNG](atividades/01-login-e-direcionamento.png) | [SVG](atividades/01-login-e-direcionamento.svg) |
| Atividades | Criar agendamento | [PNG](atividades/02-criar-agendamento.png) | [SVG](atividades/02-criar-agendamento.svg) |
| Sequência | Login e sessão | [PNG](sequencia/01-login-e-sessao.png) | [SVG](sequencia/01-login-e-sessao.svg) |
| Sequência | Criar agendamento | [PNG](sequencia/02-criar-agendamento.png) | [SVG](sequencia/02-criar-agendamento.svg) |

## Regenerar as imagens

Edite os blocos de código nos documentos 03 a 06 e execute na raiz do repositório:

```powershell
node mobile/docs/scripts/render-diagrams.cjs
```

O script usa Node.js, Java, Chrome, PlantUML 1.2026.4 e Mermaid CLI 11.12.0. As ferramentas são locais e o conteúdo dos diagramas não é enviado a serviços externos. A exportação sobrescreve os arquivos gerados em `imagens/`.

Para preparar as ferramentas em outra máquina Windows:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = 'true'
npm install --prefix "$env:TEMP/bellaapp-diagram-tools" --no-audit --no-fund @mermaid-js/mermaid-cli@11.12.0
Invoke-WebRequest -Uri 'https://github.com/plantuml/plantuml/releases/download/v1.2026.4/plantuml-1.2026.4.jar' -OutFile "$env:TEMP/bellaapp-plantuml-1.2026.4.jar"
node mobile/docs/scripts/render-diagrams.cjs
```

Java deve estar no PATH. Chrome é procurado em `C:/Program Files/Google/Chrome/Application/chrome.exe`. É possível informar caminhos alternativos pelas variáveis `CHROME_PATH`, `PLANTUML_JAR` e `DIAGRAM_TOOLS`. As ferramentas em `%TEMP%` precisam ser reinstaladas se essa pasta for limpa.

Os diagramas reproduzem as especificações dos documentos. A geração de imagens não equivale a uma nova homologação funcional do aplicativo.
