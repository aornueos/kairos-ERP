---
name: producao-pcp
description: Produção e PCP do KAIROS para fábrica de cosméticos — fórmula-mestra, ordem de produção, apontamento, rendimento, perda, custo e controle de qualidade por lote. Use ao trabalhar em qualquer tela ou regra de produção.
---

# Produção e PCP

A Pure.us fabrica. Este módulo transforma insumo em produto acabado com rastreabilidade
de lote ponta a ponta.

## Entidades

```
formula(id, tenant_id, produto_id, versao, rendimento_base, unidade, situacao, vigencia_inicio)
formula_item(formula_id, insumo_id, quantidade, unidade, perda_percentual, etapa, obrigatorio)
ordem_producao(id, tenant_id, numero, produto_id, formula_id, quantidade_planejada,
               quantidade_produzida, lote_id, situacao, inicio_previsto, fim_real)
op_insumo(op_id, insumo_id, quantidade_prevista, quantidade_apontada, lote_insumo_id)
op_apontamento(id, op_id, etapa, quantidade, perda, operador_id, ocorrido_em)
op_qualidade(op_id, teste, resultado, aprovado, responsavel_id, laudo_arquivo_id)
```

## Fórmula-mestra

Versionada e imutável depois de usada em uma OP. Alteração cria versão nova com
vigência; a OP guarda a versão que usou. Sem isso não se explica por que dois lotes do
mesmo shampoo ficaram diferentes.

Cada item tem percentual de perda esperado (evaporação, resíduo em tanque, sobra de
envase). A necessidade calculada é:

```
necessidade = (quantidade_op / rendimento_base) * quantidade_item * (1 + perda_percentual)
```

Fórmula com percentuais de base deve fechar em 100% quando o produto é definido por
concentração; valide e avise na tela.

## Ciclo da OP

```
PLANEJADA -> LIBERADA -> EM_PRODUCAO -> EM_QUALIDADE -> CONCLUIDA
                 \-> CANCELADA
```

- **Planejada**: explode a fórmula, calcula necessidade e mostra o que falta em estoque.
- **Liberada**: reserva os insumos. Sem saldo, não libera — ou libera parcial com
  aprovação registrada.
- **Em produção**: apontamentos por etapa (pesagem, mistura, envase, rotulagem), com
  lote real de cada insumo consumido.
- **Em qualidade**: pH, viscosidade, aspecto, odor e microbiológico conforme o produto.
  Reprovado vai para quarentena ou retrabalho, nunca para o estoque de acabado.
- **Concluída**: entrada do lote de acabado com validade calculada
  (`fabricacao + prazo_validade_produto`), baixa dos insumos, custo apurado, evento
  `producao.concluida`.

Nenhuma transição pula etapa. Conclusão com apontamento pendente é bloqueada.

## Custo da OP

```
custo_total = insumos consumidos (custo médio do lote real)
            + mão de obra (horas apontadas x custo hora do centro)
            + rateio de custo indireto do centro de custo
custo_unitario = custo_total / quantidade_produzida
```

Note o denominador: quantidade **produzida**, não planejada. Se rendeu menos, o custo
unitário sobe — e é exatamente isso que precisa aparecer no relatório de eficiência.

## Rendimento e perda

`rendimento = quantidade_produzida / quantidade_planejada`. Desvio acima da tolerância
(padrão 5%) exige justificativa no fechamento e entra no relatório de perdas por produto,
etapa e operador. É aqui que se descobre tanque com resíduo, balança descalibrada e
receita mal ajustada.

## Rastreabilidade e recall

A OP amarra lote de acabado a lotes de insumo. Combinada com [estoque] e [vendas],
responde nos dois sentidos: "este lote foi para quais clientes" e "este insumo entrou em
quais lotes". Tela de recall exporta a lista com nota, cliente e quantidade.

## Planejamento (MRP simplificado)

A partir de pedidos confirmados, previsão de vendas e estoque mínimo, o sistema sugere
OPs e necessidades de compra com lead time do fornecedor. Fase 2: sugestão automática.
Fase 1: tela de necessidade calculada, com o planejador decidindo.
