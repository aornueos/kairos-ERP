---
name: modular-monolith
description: Regras do monolito modular do KAIROS, incluindo fronteiras entre módulos, barrel files, lint de dependência e critérios para extrair um serviço. Use ao adicionar dependências entre módulos ou ao avaliar uma proposta de microsserviço.
---

# Monolito modular

Um processo Next.js, um banco, módulos isolados por convenção e lint.

## API pública de um módulo

Cada módulo expõe apenas `src/modules/<ctx>/index.ts`:

```ts
// src/modules/estoque/index.ts
export { reservarEstoque } from './application/reservar-estoque'
export { consultarSaldo } from './application/consultar-saldo'
export type { SaldoPorLote } from './application/dto'
```

Nada mais sai. Entidades, repositórios e modelos Prisma do módulo são privados.

## Lint que segura a fronteira

```js
// eslint.config.js
{
  files: ['src/modules/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/modules/*/domain/*', '@/modules/*/infra/*', '@/modules/*/application/*'],
          message: 'Importe apenas o index.ts público do módulo.' },
        { group: ['@/shared/db/client'],
          message: 'Acesso a Prisma só dentro de infra/.' },
      ],
    }],
  },
}
```

Exceção: o próprio módulo importando seus arquivos internos por caminho relativo.

## Transação entre módulos

Não abra transação de um módulo dentro de outro. Se dois contextos precisam commitar
juntos, ou eles são o mesmo contexto, ou a consistência é eventual via outbox.

Único caso permitido de transação compartilhada: faturamento (baixa de estoque, geração
de título e registro fiscal), coordenado por um caso de uso em `faturamento` que chama
portas dos outros módulos dentro do mesmo `prisma.$transaction`. Está documentado em ADR;
não replique o padrão sem ADR novo.

## Quando extrair um serviço

Só quando pelo menos dois forem verdade:

- o módulo precisa escalar com perfil de carga muito diferente do resto;
- o time que o mantém é outro;
- o SLA de disponibilidade exigido é diferente.

O volume da Pure.us não justifica extração. Registre o pedido como ADR rejeitado.

## Estrutura de pastas

```
src/
  app/(erp)/<rota>/page.tsx      telas, sem regra de negócio
  app/api/                       webhooks e integrações externas
  modules/<ctx>/{domain,application,infra,ui}
  shared/{ui,lib,auth,db,errors,money,dates}
  workers/                       entrypoints pg-boss
prisma/{schema/,migrations/,seed/}
```
