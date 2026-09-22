---
name: env-config
description: Configuração e variáveis de ambiente do KAIROS — validação na inicialização, separação entre config e parâmetro de negócio, segredos e ambientes. Use ao adicionar configuração ou preparar um ambiente.
---

# Configuração

## Regra de separação

| Tipo | Onde mora | Exemplo |
|---|---|---|
| Configuração de infraestrutura | variável de ambiente | `DATABASE_URL`, `S3_BUCKET` |
| Segredo | gerenciador de segredos | certificado A1, credencial bancária |
| Parâmetro de negócio | banco, por tenant | limite de desconto, dias de reserva, alíquota |

Parâmetro de negócio em variável de ambiente é erro: o usuário precisa mudar sem deploy,
e cada tenant tem o seu.

## Validação na inicialização

```ts
// src/shared/config/env.ts
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  KAIROS_ENV: z.enum(['dev', 'homolog', 'prod']),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  S3_ENDPOINT: z.url(),
  S3_BUCKET: z.string(),
  FISCAL_PROVEDOR_URL: z.url(),
  FISCAL_PROVEDOR_TOKEN: z.string().min(10),
  SENTRY_DSN: z.url().optional(),
  TZ: z.literal('America/Sao_Paulo'),
})
export const env = schema.parse(process.env)
```

Falta de variável derruba o processo na inicialização, com mensagem clara. Descobrir
variável faltando no meio do faturamento é muito pior que não subir.

Nunca `process.env.X` espalhado pelo código: sempre `env.X` tipado.

## Cliente e servidor

Só `NEXT_PUBLIC_*` chega ao navegador. Revise cada uma: variável pública com token de
provedor vaza para qualquer visitante. O lint bloqueia importar `env` do servidor em
componente cliente.

## Arquivos

```
.env.example     versionado, com todas as chaves e valores de exemplo (sem segredo)
.env.local       local, no .gitignore
```

Chave nova entra no `.env.example` no mesmo PR, senão o próximo desenvolvedor descobre
por erro de execução.

## Parâmetros por tenant

```
parametro(tenant_id, chave, valor, tipo, descricao, alterado_por, alterado_em)
```

Tela de configurações com validação por tipo e auditoria. Exemplos: dias de validade da
reserva, limite de desconto por perfil, tolerância de divergência no recebimento,
alíquotas e regimes fiscais, régua de cobrança, contas contábeis padrão.

Todo parâmetro tem default seguro no código: tenant novo funciona sem configurar nada.

## Ambientes

| Ambiente | Banco | Fiscal | Notificações |
|---|---|---|---|
| dev | local em Docker | provedor em sandbox | Mailpit |
| homolog | gerenciado, dados anonimizados | sandbox | e-mail interno |
| prod | gerenciado, com PITR | produção | real |

Ambiente não produtivo nunca usa credencial de produção, e o seed demo aborta se detectar
`KAIROS_ENV=prod` (ver [data-seeding]).
