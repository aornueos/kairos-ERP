---
name: backup-restore
description: Estratégia de backup, restauração e teste de recuperação do KAIROS (Postgres, XMLs fiscais e anexos). Use ao configurar ambiente, antes de migration arriscada e no ensaio periódico de restore.
---

# Backup e restauração

Alvos declarados: RPO 15 minutos, RTO 4 horas. Backup que nunca foi restaurado não é
backup.

## O que precisa de cópia

| Ativo | Método | Frequência | Retenção |
|---|---|---|---|
| PostgreSQL | dump lógico + WAL archiving (PITR) | dump diário, WAL contínuo | 30 dias + mensal por 5 anos |
| XML e PDF fiscais (S3) | versionamento + replicação de bucket | contínuo | 5 anos (exigência legal) |
| Anexos e imagens de produto | versionamento de bucket | contínuo | 1 ano |
| Certificado digital A1 | cofre de segredos, fora do backup comum | a cada renovação | vigência + 1 ano |
| Variáveis de ambiente | gerenciador de segredos com versão | a cada mudança | 1 ano |

## Dump diário

```bash
pg_dump --format=custom --compress=9 --no-owner --no-privileges \
  --file=kairos-$(date +%F).dump "$DATABASE_URL"
```

Envie para armazenamento fora do provedor do banco. Cópia no mesmo provedor protege
contra falha de disco, não contra exclusão de conta ou erro de operação.

## PITR

WAL archiving ativo permite voltar a um instante anterior. É o que salva de
`delete` sem `where` e de migration destrutiva. Teste o procedimento com data-alvo real,
não só o comando.

## Restauração

```bash
createdb kairos_restore
pg_restore --dbname=kairos_restore --jobs=4 --no-owner kairos-2026-09-21.dump
```

Depois de restaurar em ambiente de teste, sempre:

1. `pnpm prisma migrate status` para confirmar o nível de schema;
2. conferência de totais: contagem de notas, soma de títulos em aberto, saldo de estoque;
3. verificação de RLS ativa (`scripts/check-rls.ts`);
4. rotação de segredos: o dump restaurado não deve apontar para integrações de produção.

## Ensaio obrigatório

Restauração completa em ambiente limpo uma vez por trimestre, cronometrada, com o
resultado registrado em `docs/operacao/ensaios-restore.md`: data, tempo total, tamanho,
problemas encontrados. Se passou de um trimestre sem ensaio, o RTO declarado é ficção.

## Antes de migration arriscada

Snapshot manual imediatamente antes, com nome que identifica a migration, e plano de
rollback escrito no PR. Ver [migrations] e [deploy-checklist].

## Dados para desenvolvimento

Nunca copie produção para a máquina de dev sem anonimizar. Use
`scripts/anonimizar-dump.sql`, que embaralha nome, CPF/CNPJ, e-mail, telefone e endereço
de parceiros e usuários, preservando volumes e distribuição.
