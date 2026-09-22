---
name: contabilidade
description: Integração contábil do KAIROS — lançamentos automáticos por partida dobrada, modelos contábeis, fechamento de período e entrega ao contador. Use ao gerar lançamento contábil ou tratar fechamento.
---

# Contabilidade

A Pure.us tem contador externo. O KAIROS não substitui o escritório contábil: gera os
lançamentos, os relatórios e os arquivos que o contador consome sem redigitação.

## Partida dobrada

Todo fato contábil gera lançamento com débito e crédito de mesmo valor:

```
lancamento_contabil(id, tenant_id, data, historico, documento_tipo, documento_id,
                    origem, situacao)
lancamento_partida(lancamento_id, conta_id, centro_custo_id, tipo, valor)
```

`sum(debito) = sum(credito)` é `check` no banco, não só validação na aplicação.

## Modelos de lançamento

Configuráveis por evento, para não cravar conta contábil no código:

| Evento | Débito | Crédito |
|---|---|---|
| Venda faturada | Clientes a receber | Receita de vendas |
| Impostos sobre venda | Impostos sobre vendas (despesa) | Impostos a recolher |
| Baixa de estoque na venda | CMV | Estoque de produtos acabados |
| Recebimento de título | Banco | Clientes a receber |
| Compra de insumo | Estoque de matéria-prima | Fornecedores |
| Pagamento a fornecedor | Fornecedores | Banco |
| Produção concluída | Estoque de acabados | Estoque de MP + Custo de produção |
| Folha | Despesa com pessoal | Salários a pagar |
| Depreciação | Despesa de depreciação | Depreciação acumulada |

O modelo aponta contas do [plano-de-contas] e usa o centro de custo do documento.
Mudou a regra? Muda o modelo, não o código.

## Geração

Lançamentos nascem de eventos de domínio (`pedido.faturado`, `titulo.baixado`,
`producao.concluida`), processados por job. Falha na geração não bloqueia a operação: vai
para a fila de pendências contábeis, visível e reprocessável. Operação parada porque a
contabilidade falhou é pior que lançamento atrasado.

## Fechamento de período

```
periodo_contabil(tenant_id, competencia, situacao, fechado_em, fechado_por)
```

`ABERTO -> EM_FECHAMENTO -> FECHADO`. Período fechado bloqueia qualquer lançamento com
data dentro dele, em todos os módulos: financeiro, estoque e fiscal consultam o mesmo
serviço antes de gravar. Reabrir exige permissão de administrador, motivo e auditoria.

Checklist de fechamento mensal na tela: conciliação bancária concluída, inventário
conferido, notas do mês transmitidas, apuração de impostos gerada, pendências contábeis
zeradas.

## Relatórios

Balancete, razão por conta, diário, DRE contábil e balanço patrimonial. Todos com filtro
por competência e centro de custo, e exportação em XLSX e PDF.

## Entrega ao contador

Pacote mensal automático: SPED Fiscal e Contribuições ([sped-fiscal]), SPED Contábil
([sped-contabil]), XMLs do mês, balancete e relação de títulos. Gerado por job e
disponibilizado para download ou envio por e-mail no dia configurado.
