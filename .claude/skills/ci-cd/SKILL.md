---
name: ci-cd
description: Pipeline de CI/CD do KAIROS com GitHub Actions — etapas, gates, ambientes, migrations e rollback. Use ao alterar workflow, adicionar verificação ou investigar falha de pipeline.
---

# CI/CD

## Pipeline em pull request

```
1. lint          eslint + prettier --check
2. tipos         tsc --noEmit
3. unit          vitest run (unitários)
4. integração    vitest run (Testcontainers com Postgres)
5. build         next build
6. e2e           playwright (jornadas críticas)
7. segurança     pnpm audit + gitleaks
8. rls           scripts/check-rls.ts (toda tabela com tenant_id tem policy)
```

Etapas 1 a 3 rodam em paralelo; as demais dependem delas. Alvo: feedback completo em
menos de 12 minutos. Pipeline lento é pipeline ignorado.

Merge bloqueado se qualquer etapa falhar. Sem exceção "só dessa vez": a exceção vira
regra em duas semanas.

## Ambientes

| Ambiente | Origem | Deploy |
|---|---|---|
| Preview | pull request | automático, banco efêmero com seed demo |
| Homologação | `main` | automático |
| Produção | tag `v*` | manual, com aprovação |

Produção nunca sai direto de `main`. Tag e aprovação criam o momento de conferência.

## Deploy

```
1. build da imagem e push com a tag do commit
2. migrate deploy em job próprio (nunca no start do app)
3. sobe o worker novo
4. sobe o app novo
5. health check (/api/health verifica banco, fila e storage)
6. rollback automático se o health falhar em 2 minutos
```

Migration sempre compatível com a versão anterior do app (ver [migrations]). Essa é a
regra que permite subir sem janela de manutenção.

## Rollback

Imagem anterior fica disponível; voltar é trocar a tag e reiniciar. Migration não é
revertida automaticamente — por isso a regra de compatibilidade. Se uma migration
destrutiva precisar voltar, o plano de rollback tem que estar escrito no PR antes do
merge.

## Segredos

Guardados no provedor (GitHub Environments), separados por ambiente, sem acesso de
workflow de PR vindo de fork. Rotação semestral e sempre que alguém sai do time.

## Convenções de branch

`main` protegida, trabalho em branch curta (`feat/`, `fix/`, `chore/`), PR com revisão de
uma pessoa, squash merge. Commit no padrão convencional para alimentar o [changelog].

## Diagnóstico de falha

Teste E2E instável não se resolve com re-run: abra issue e conserte. Falha de integração
no CI que não reproduz local costuma ser fuso (`TZ` diferente), ordem de execução ou dado
compartilhado entre testes.
