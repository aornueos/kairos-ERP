---
name: deploy-checklist
description: Checklist de deploy do KAIROS — antes, durante e depois, com critérios de rollback e cuidados de fim de mês. Use em todo deploy para produção.
---

# Checklist de deploy

## Antes

- [ ] CI verde na tag (lint, tipos, testes, build, E2E, segurança, RLS).
- [ ] Migrations revisadas e compatíveis com a versão anterior do app.
- [ ] Migration pesada testada contra dump de produção, com o tempo medido.
- [ ] Backup recente confirmado (ver [backup-restore]).
- [ ] Variáveis de ambiente novas criadas no ambiente de destino (ver [env-config]).
- [ ] Segredos e certificados válidos (A1, credenciais bancárias, provedor fiscal).
- [ ] Changelog atualizado e usuários avisados se houver mudança de fluxo.
- [ ] Plano de rollback escrito no PR.
- [ ] Janela adequada: **nunca** durante o fechamento contábil, no dia de pagamento da
      folha, no vencimento de impostos ou no pico de faturamento.

## Durante

- [ ] Imagem construída e marcada com o commit.
- [ ] `prisma migrate deploy` em job próprio, com o resultado conferido.
- [ ] Worker novo no ar antes do app.
- [ ] App novo no ar; health check passando.
- [ ] Fumaça manual: login, abrir pedido, emitir uma nota em homologação fiscal, abrir
      painel financeiro.

## Depois

- [ ] Erros no Sentry nos primeiros 15 minutos.
- [ ] Latência das rotas principais comparável à anterior.
- [ ] Fila de jobs drenando normalmente.
- [ ] Notas transmitidas e autorizadas depois do deploy.
- [ ] Conferência noturna de faturamento sem divergência nova.
- [ ] Tag anotada no changelog com data e responsável.

## Rollback

Dispare se: health falhando, taxa de erro acima de 5%, emissão fiscal parada, ou qualquer
suspeita de inconsistência de dado.

```
1. voltar a imagem anterior (app e worker)
2. confirmar health
3. avaliar o estado dos dados gravados na janela ruim
4. comunicar quem foi afetado
5. registrar o incidente
```

Migration não volta sozinha. Se a versão anterior não funcionar com o schema novo, a
regra de compatibilidade foi violada — e esse é o defeito a corrigir, não o sintoma.

## Primeiro deploy em produção

Tem passos próprios: criar o tenant da Pure.us, rodar o seed base, cadastrar parâmetros
fiscais com o contador, importar saldos iniciais (ver [import-export-csv]), conferir
totais e só então liberar acesso aos usuários. Faça em dia de baixo movimento, com o
contador disponível.
