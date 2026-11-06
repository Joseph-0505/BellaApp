# Architecture Decision Records

Os ADRs registram decisões já refletidas no código. O status **Aceita** significa
que a decisão descreve o estado atual, não que seja irreversível.

| ADR | Decisão | Status |
|---|---|---|
| [ADR-0001](0001-monolito-modular.md) | Monólito modular com Fastify | Aceita |
| [ADR-0002](0002-mysql-prisma-multiclinica.md) | MySQL + Prisma e isolamento por clínica | Aceita |
| [ADR-0003](0003-redis-cache-eventos.md) | Redis para cache-aside e Pub/Sub | Aceita |
| [ADR-0004](0004-docker-compose-nginx.md) | Docker Compose e Nginx para entrega reproduzível | Aceita |

## Modelo adotado

Cada registro contém:

1. contexto e problema;
2. direcionadores;
3. alternativas consideradas;
4. decisão;
5. consequências positivas e negativas;
6. evidências no repositório.
