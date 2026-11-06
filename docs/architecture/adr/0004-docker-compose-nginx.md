# ADR-0004 — Orquestrar com Docker Compose e expor pelo Nginx

- **Status:** Aceita
- **Data:** 05/11/2026
- **Decisores:** equipe BellaApp

## Contexto

A demonstração precisa iniciar frontend, backend, MySQL, Redis e proxy com um
procedimento reproduzível. O web deve usar HTTPS e a API precisa ficar sob a
mesma origem para reduzir configuração de CORS e aproximação com uma topologia
de produção.

## Direcionadores

- um comando de inicialização;
- dependências e ordem de prontidão explícitas;
- TLS local e proxy reverso;
- banco, cache e volumes isolados;
- possibilidade de testar o mobile contra a porta da API no desenvolvimento.

## Alternativas consideradas

### Executar processos diretamente na máquina

Tem ciclo rápido, mas depende de versões locais de Node, MySQL e Redis e produz
diferenças entre máquinas.

### Kubernetes

Ofereceria orquestração, escalabilidade e rollout mais próximos de produção,
mas é desproporcional para um ambiente local de cinco contêineres e aumenta o
custo de apresentação.

### Servir frontend diretamente pelo backend

Reduziria um contêiner, porém misturaria responsabilidades e impediria validar
o proxy reverso exigido pela rúbrica.

## Decisão

Usar **Docker Compose** com rede `bellaapp-network`, volumes nomeados e health
checks. MySQL e Redis iniciam primeiro; backend depende dos dois; frontend
depende do backend; Nginx depende de backend e frontend saudáveis.

Usar **Nginx** como entrada web:

- porta 80 redireciona para 443;
- `/` é encaminhado ao Vite Preview do frontend;
- `/api/` é encaminhado ao Fastify;
- certificado local é gerado por `mkcert` e não versionado;
- cabeçalhos de proxy e segurança são adicionados no gateway.

O override local publica a API na porta 3000 para Expo/emulador e MySQL na 3307
para inspeção local.

## Consequências positivas

- ambiente reproduzível e verificável por health checks;
- dependências isoladas em rede própria;
- HTTPS e mesma origem para o web;
- persistência de banco e uploads entre reinícios;
- build da aplicação é validado dentro de imagens limpas.

## Consequências negativas e riscos

- Compose não fornece alta disponibilidade nem rollout sem indisponibilidade;
- certificados `mkcert` exigem configuração por máquina;
- o frontend usa Vite Preview, adequado à demonstração, mas não é o servidor
  estático recomendado para produção em escala;
- o Nginx não possui health check próprio no Compose e precisa ser verificado
  por requisição externa;
- segredos continuam sendo responsabilidade dos arquivos `.env` locais.

## Evidências

- `docker-compose.yml` e `docker-compose.override.yml`;
- `backend/Dockerfile` e `Frontend/bellaapp-frontend/Dockerfile`;
- `nginx/default.conf`;
- instruções de inicialização no `README.md`.
