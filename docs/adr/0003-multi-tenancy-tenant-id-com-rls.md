# 0003 — Multi-tenancy por tenant_id com Row Level Security

- Status: aceito
- Data: 2026-09-22
- Decisores: Raul (produto e engenharia)

## Contexto

Hoje existe um único cliente: a Pure.us. Existe, porém, a possibilidade concreta de
separar CNPJs (matriz e filial), abrir ambiente de demonstração e, mais adiante,
licenciar o sistema para outras empresas do setor.

Converter um sistema single-tenant em multi-tenant depois exige alterar todas as tabelas,
todos os índices e todas as consultas — custo alto e risco de vazamento entre empresas
durante a migração.

## Decisão

Base de dados única, com `tenant_id uuid not null` em toda tabela de negócio e Row Level
Security no PostgreSQL.

Regras que decorrem da decisão:

- todo índice e toda restrição de unicidade começam por `tenant_id`;
- as policies usam `current_setting('app.tenant_id')`, definido por transação através de
  uma extensão do Prisma Client;
- `force row level security` é obrigatório, e a role da aplicação não é dona das tabelas
  nem superusuário;
- tabelas globais (tenant, usuário, município, NCM, CFOP, banco) são explicitamente
  listadas e não têm policy;
- todo job carrega `tenantId` no payload;
- toda chave de cache e todo caminho de arquivo no armazenamento começam pelo tenant;
- cada módulo tem teste automatizado que tenta ler dado de outro tenant e falha.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Single-tenant | mais simples agora, muito caro de converter depois |
| Um schema por tenant | isolamento forte, mas migrations e operação ficam complexas para dezenas de schemas |
| Um banco por tenant | custo de infraestrutura e operação desproporcional ao porte |

## Consequências

Positivas: caminho aberto para filiais, demonstração e licenciamento sem reescrita. A RLS
funciona como rede de segurança mesmo quando a aplicação erra o filtro.

Negativas: toda consulta e todo índice ficam um pouco mais verbosos; a extensão do Prisma
precisa abrir transação para definir o contexto, o que tem custo; um erro na configuração
de policy é grave e precisa de verificação automatizada no CI (`scripts/check-rls.ts`).

Vazamento entre tenants é tratado como incidente de severidade máxima.

## Revisão

Revisitar se algum cliente exigir isolamento físico por contrato, ou se o volume de um
tenant justificar banco dedicado.
