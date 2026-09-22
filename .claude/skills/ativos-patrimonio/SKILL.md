---
name: ativos-patrimonio
description: Controle patrimonial do KAIROS — imobilizado, depreciação, manutenção de equipamentos de produção e inventário de bens. Use ao cadastrar bem, calcular depreciação ou controlar manutenção.
---

# Ativos e patrimônio

Fase 3. Controla os bens da Pure.us: tanques, misturadores, envasadoras, balanças,
equipamentos de laboratório, veículos, móveis e informática.

## Entidades

```
bem(id, tenant_id, codigo, descricao, categoria_id, centro_custo_id, fornecedor_id,
    nota_aquisicao, data_aquisicao, valor_aquisicao, valor_residual, vida_util_meses,
    metodo_depreciacao, situacao, localizacao)
depreciacao(bem_id, competencia, valor, valor_acumulado, valor_contabil)
manutencao(id, bem_id, tipo, previsto_para, executado_em, custo, fornecedor_id,
           descricao, parada_producao_horas)
calibracao(id, bem_id, executado_em, proximo_em, certificado_id, responsavel)
```

## Depreciação

Método linear por padrão:

```
depreciacao_mensal = (valor_aquisicao - valor_residual) / vida_util_meses
```

Roda por job no fechamento mensal, gera lançamento contábil (despesa por centro de custo
do bem) e não pode depreciar além do valor depreciável. Bem baixado ou vendido interrompe
a depreciação na competência da baixa e apura ganho ou perda de capital.

Taxas usuais seguem a tabela da Receita (máquinas 10% a.a., móveis 10%, informática 20%,
veículos 20%). O contador confirma antes de cadastrar.

## Manutenção

Preventiva com periodicidade (por tempo ou por horas de uso) e corretiva registrada com
custo e tempo de parada. Alerta antecipado de manutenção prevista, porque parada não
planejada de envasadora atrasa OP e entrega.

Custo de manutenção vai para o centro de custo do bem e entra no custo indireto de
produção (ver [centro-de-custo]).

## Calibração

Balança e instrumento de medição de laboratório exigem calibração periódica com
certificado. Instrumento com calibração vencida bloqueia o apontamento de pesagem na OP
— pesagem fora de controle compromete a fórmula e a conformidade do lote.

## Inventário de bens

Etiqueta com código de barras por bem, conferência periódica por localização e registro
de divergência com responsável. Bem não localizado vira ocorrência, não some do cadastro.

## Relatórios

Imobilizado por categoria e centro, depreciação do período, valor contábil residual,
custo de manutenção por equipamento, disponibilidade dos equipamentos críticos.
