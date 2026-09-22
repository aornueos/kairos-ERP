---
name: data-seeding
description: Seeds do KAIROS — dados fixos obrigatórios, massa de demonstração da Pure.us e fixtures de teste. Use ao preparar ambiente novo, criar dados para testes ou atualizar tabelas de domínio.
---

# Seeds

Três níveis, sempre separados. Nunca misture demonstração com dados obrigatórios.

```
prisma/seed/
  base/         obrigatório em todo ambiente, inclusive produção
  demo/         massa fictícia da Pure.us, só dev e homologação
  fixtures/     cenários mínimos usados nos testes
```

```bash
pnpm seed:base   # idempotente, roda em todo deploy
pnpm seed:demo   # só em dev/homologação, exige banco não produtivo
```

## Base (obrigatório)

Tabelas de domínio sem as quais o sistema não opera:

- UF, municípios IBGE, países BACEN;
- NCM, CEST, CFOP, CSOSN/CST, unidades de medida;
- bancos (FEBRABAN), formas e condições de pagamento padrão;
- plano de contas referencial e centros de custo iniciais;
- perfis de acesso padrão e permissões (ver [permissions-matrix]);
- tenant Pure.us com CNPJ, regime tributário e parâmetros fiscais.

Regra: idempotente por `upsert` com chave natural. Rodar duas vezes não pode duplicar
nem sobrescrever alteração feita pelo usuário — só insere o que falta.

Tabelas grandes (municípios, NCM) vêm de arquivo versionado em `prisma/seed/base/data/*.csv`
com a data e a fonte no cabeçalho do arquivo.

## Demo (Pure.us fictícia)

Massa coerente para vender e treinar, refletindo o negócio real:

- linhas capilares (nutrição, reconstrução, matizador, finalizador) com SKUs por volume;
- insumos: base, ativo, essência, conservante, embalagem, rótulo, caixa;
- fórmulas-mestras com rendimento e perda;
- 30 clientes (salões, distribuidores, varejo) e 8 fornecedores;
- 6 meses de pedidos, produções, notas e títulos, com sazonalidade;
- lotes com validade variada, incluindo um vencido e um a vencer, para testar bloqueio.

Seed demo nunca usa CNPJ, e-mail ou telefone reais. Gere com dígito verificador válido
mas de faixa claramente fictícia, e marque `tenant.ambiente = 'demo'`.

## Fixtures de teste

Uma função por cenário, componível, sem depender de ordem de execução:

```ts
export async function umPedidoConfirmado(t: TestContext, over?: Partial<Pedido>) { ... }
```

Cada teste cria o que precisa dentro de transação com rollback no final.
Nada de banco compartilhado entre testes (ver [integration-testing]).

## Proteções

- `seed:demo` aborta se `DATABASE_URL` contiver host de produção ou se
  `KAIROS_ENV=production`.
- Seed nunca cria usuário com senha fixa conhecida em produção. O primeiro admin é
  criado por comando interativo com senha informada na hora.
