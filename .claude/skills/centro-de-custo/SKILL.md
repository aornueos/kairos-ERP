---
name: centro-de-custo
description: Centros de custo e rateio no KAIROS — estrutura, obrigatoriedade por tipo de lançamento, rateio de despesas indiretas e apuração de resultado por centro. Use ao classificar despesa, apurar custo de produção ou montar relatório gerencial.
---

# Centro de custo

Responde "onde o dinheiro foi gasto e quanto cada área custa". Sem isso, o custo do
produto é chute e a despesa vira uma massa indistinta.

## Estrutura

```
centro_custo(id, tenant_id, codigo, nome, tipo, centro_pai_id, responsavel_id, ativo)
   -- tipo: PRODUTIVO | APOIO | ADMINISTRATIVO | COMERCIAL
```

Sugestão para a Pure.us:

```
1 Produção
  1.1 Pesagem e manipulação
  1.2 Envase e rotulagem
  1.3 Controle de qualidade
2 Apoio
  2.1 Almoxarifado
  2.2 Manutenção
3 Comercial
  3.1 Vendas internas   3.2 Representantes   3.3 Marketing
4 Administrativo
  4.1 Diretoria   4.2 Financeiro   4.3 TI
```

## Obrigatoriedade

| Lançamento | Centro de custo |
|---|---|
| Despesa (título a pagar, folha, depreciação) | obrigatório |
| Custo de produção (OP, apontamento) | obrigatório, sempre produtivo |
| Compra de insumo para estoque | não se aplica (vai para estoque, não para despesa) |
| Receita | opcional, usado para resultado por canal |

A regra é do sistema, não do usuário: a tela exige quando o tipo pedir. Permitir "sem
centro" abre a porta para uma conta "Diversos" que engole metade da despesa.

## Rateio

Despesa que atende mais de um centro (aluguel, energia, TI) é rateada por critério
cadastrado e estável:

```
rateio_regra(id, tenant_id, natureza_id, criterio, vigencia_inicio)
rateio_item(regra_id, centro_custo_id, percentual)
```

Critérios: percentual fixo, área ocupada, número de pessoas, horas apontadas, consumo
medido. O rateio é aplicado no fechamento mensal por job, gerando lançamentos de rateio
identificáveis e estornáveis — não altera o lançamento original.

Centros de apoio podem ser rateados para os produtivos em uma segunda etapa (rateio em
cascata), na ordem definida em parâmetro.

## Custo de produção

Custo indireto do centro produtivo do mês, dividido pelas horas ou pela quantidade
produzida, forma a taxa aplicada às OPs (ver [producao-pcp]). A taxa é recalculada
mensalmente e a OP guarda a taxa usada.

## Relatórios

Despesa por centro com comparação mensal e contra orçamento, resultado por centro,
custo unitário por centro produtivo, e rateios recebidos de forma destacada. Toda linha
navega até os documentos que a compõem.
