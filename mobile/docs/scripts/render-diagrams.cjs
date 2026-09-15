/** Render the documentation sources locally; no diagram content is uploaded. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const docs = path.resolve(__dirname, '..');
const tooling = process.env.DIAGRAM_TOOLS || path.join(os.tmpdir(), 'bellaapp-diagram-tools');
const jar = process.env.PLANTUML_JAR || path.join(os.tmpdir(), 'bellaapp-plantuml-1.2026.4.jar');
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const jobs = [
  ['03-DIAGRAMA-ENTIDADE-RELACIONAMENTO.md', 'der', ['01-nucleo-mobile', '02-extensao-financeira']],
  ['04-DIAGRAMAS-CASOS-DE-USO.md', 'casos-de-uso', ['01-acesso-e-conta', '02-gestao-e-agenda']],
  ['05-DIAGRAMAS-ATIVIDADES.md', 'atividades', ['01-login-e-direcionamento', '02-criar-agendamento']],
  ['06-DIAGRAMAS-SEQUENCIA.md', 'sequencia', ['01-login-e-sessao', '02-criar-agendamento']],
];
const style = `
skinparam backgroundColor white
skinparam defaultFontName Arial
skinparam defaultFontSize 14
skinparam shadowing false
skinparam ArrowColor #785663
skinparam actorBorderColor #785663
skinparam actorBackgroundColor #F8E8ED
skinparam usecaseBackgroundColor #F8E8ED
skinparam usecaseBorderColor #B75C75
skinparam activityBackgroundColor #F8E8ED
skinparam activityBorderColor #B75C75
skinparam activityDiamondBackgroundColor #EDF4EF
skinparam activityDiamondBorderColor #7B9E87
skinparam participantBackgroundColor #F8E8ED
skinparam participantBorderColor #B75C75
skinparam sequenceLifeLineBorderColor #BCAAB1
skinparam noteBackgroundColor #FFF9EE
skinparam roundcorner 12
`;

function run(executable, args, input) {
  const result = spawnSync(executable, args, {
    input, maxBuffer: 40 * 1024 * 1024, windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${executable}: ${result.error || result.stderr?.toString() || result.status}`);
  }
  return result.stdout;
}

async function main() {
  const puppeteer = require(path.join(tooling, 'node_modules', 'puppeteer'));
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bellaapp-diagram-config-'));
  const puppeteerConfig = path.join(configDir, 'puppeteer.json');
  const mermaidConfig = path.join(configDir, 'mermaid.json');
  fs.writeFileSync(puppeteerConfig, JSON.stringify({ executablePath: chrome, headless: true }));
  fs.writeFileSync(mermaidConfig, JSON.stringify({
    theme: 'base', fontFamily: 'Arial',
    themeVariables: { primaryColor: '#F8E8ED', primaryTextColor: '#2D2630',
      primaryBorderColor: '#B75C75', lineColor: '#785663',
      secondaryColor: '#EDF4EF', tertiaryColor: '#FFFFFF', fontSize: '16px' },
    er: { diagramPadding: 30, useMaxWidth: false },
  }));
  try {
    for (const [document, group, names] of jobs) {
      const text = fs.readFileSync(path.join(docs, document), 'utf8');
      const blocks = [...text.matchAll(/```(mermaid|plantuml)\s*\r?\n([\s\S]*?)```/g)];
      if (blocks.length !== names.length) throw new Error(`Unexpected block count: ${document}`);
      for (let i = 0; i < blocks.length; i++) {
        const [, language, source] = blocks[i];
        const dir = path.join(docs, 'imagens', group);
        fs.mkdirSync(dir, { recursive: true });
        const base = path.join(dir, names[i]);
        const svgPath = `${base}.svg`;
        if (language === 'plantuml') {
          const styled = source.replace('@startuml', `@startuml\n${style}`);
          fs.writeFileSync(`${base}.puml`, styled);
          const svg = run('java', ['-Djava.awt.headless=true', '-jar', jar, '-charset', 'UTF-8', '-tsvg', '-pipe'], Buffer.from(styled));
          if (!svg.includes(Buffer.from('<svg')) || svg.includes(Buffer.from('Syntax Error?'))) {
            throw new Error(`Invalid PlantUML output: ${base}`);
          }
          fs.writeFileSync(svgPath, svg);
        } else {
          fs.writeFileSync(`${base}.mmd`, source);
          run(process.execPath, [path.join(tooling, 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js'),
            '-i', `${base}.mmd`, '-o', svgPath, '-p', puppeteerConfig, '-c', mermaidConfig, '-b', 'white', '-w', '2400']);
        }
        const page = await browser.newPage();
        await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
        await page.setContent(`<html><head><meta charset="utf-8"></head><body style="margin:0;background:white">${fs.readFileSync(svgPath, 'utf8')}</body></html>`);
        await page.evaluate(async () => {
          await document.fonts.ready;
          const svg = document.querySelector('svg');
          const vb = svg.viewBox.baseVal;
          svg.style.maxWidth = 'none';
          if (vb.width && vb.height) {
            svg.setAttribute('width', vb.width);
            svg.setAttribute('height', vb.height);
          }
        });
        const element = await page.$('svg');
        const size = await element.boundingBox();
        await element.screenshot({ path: `${base}.png`, omitBackground: false });
        await page.close();
        console.log(`${group}/${names[i]}: PNG ${Math.round(size.width * 2)}x${Math.round(size.height * 2)} + SVG`);
      }
    }
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
