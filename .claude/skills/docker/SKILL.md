---
name: docker
description: Containers do KAIROS — Dockerfile multi-stage, compose de desenvolvimento, imagem de produção e worker. Use ao mexer em build, ambiente local ou empacotamento.
---

# Docker

## Desenvolvimento

`docker-compose.yml` sobe apenas a infraestrutura; a aplicação roda no host com
`pnpm dev` para ter hot reload decente.

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: kairos
      POSTGRES_DB: kairos
      TZ: America/Sao_Paulo
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
  mailpit:
    image: axllent/mailpit
    ports: ["8025:8025", "1025:1025"]
volumes: { pgdata: }
```

Mailpit captura e-mails localmente: ninguém manda notificação de teste para cliente real.

## Produção

Multi-stage, saída `standalone` do Next:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm prisma generate && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production TZ=America/Sao_Paulo
RUN addgroup -S kairos && adduser -S kairos -G kairos
COPY --from=build --chown=kairos:kairos /app/.next/standalone ./
COPY --from=build --chown=kairos:kairos /app/.next/static ./.next/static
COPY --from=build --chown=kairos:kairos /app/public ./public
COPY --from=build --chown=kairos:kairos /app/prisma ./prisma
USER kairos
EXPOSE 3000
CMD ["node", "server.js"]
```

Regras: nunca rodar como root, `.dockerignore` excluindo `node_modules`, `.env`, `.git` e
testes, tag por commit (`kairos:sha-abc1234`) e não só `latest`.

## Worker

Mesma imagem, comando diferente (`node worker.js`), container próprio e escala
independente. Migrations rodam em um job de inicialização separado, nunca no start do app
— dois containers subindo ao mesmo tempo aplicariam a mesma migration em paralelo.

## Composição de produção

`app`, `worker`, `postgres` (ou banco gerenciado) e proxy reverso com TLS. Orquestração
com Docker Compose em VPS ou plataforma tipo Coolify/Dokploy: suficiente para o porte, e
muito mais simples que Kubernetes.

## Fuso e locale

`TZ=America/Sao_Paulo` e locale pt-BR no container evitam surpresa em formatação e em
`date` de script. O banco continua em UTC (ver [backend-conventions]).
