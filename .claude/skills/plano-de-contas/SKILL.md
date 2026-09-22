---
name: plano-de-contas
description: Plano de contas contábil e gerencial do KAIROS — estrutura, codificação, contas sintéticas e analíticas, e vínculo com naturezas financeiras. Use ao cadastrar conta, configurar modelo contábil ou montar relatório por conta.
---

# Plano de contas

Duas visões sobre a mesma realidade:

- **Contábil**: segue a estrutura legal, alimenta SPED e balanço. Definida com o contador.
- **Gerencial** (naturezas financeiras): como a diretoria entende o negócio.

Cada natureza gerencial aponta para uma conta contábil. O usuário do financeiro classifica
pela natureza, que ele entende; o lançamento contábil sai certo automaticamente.

## Estrutura

```
conta_contabil(id, tenant_id, codigo, nome, tipo, natureza_saldo, sintetica,
               conta_pai_id, aceita_lancamento, ativo)
```

- `tipo`: ATIVO, PASSIVO, PATRIMONIO_LIQUIDO, RECEITA, DESPESA, CUSTO.
- `natureza_saldo`: DEVEDORA ou CREDORA.
- Conta sintética agrupa e nunca recebe lançamento (`aceita_lancamento = false`).
- Código hierárquico por nível: `1.1.01.001`. O nível é derivado do código, não digitado.

## Esqueleto (referencial, ajustar com o contador)

```
1 Ativo
  1.1 Circulante
    1.1.01 Caixa e equivalentes
    1.1.02 Clientes a receber
    1.1.03 Estoques
      1.1.03.001 Matéria-prima
      1.1.03.002 Material de embalagem
      1.1.03.003 Produtos em elaboração
      1.1.03.004 Produtos acabados
    1.1.04 Impostos a recuperar
  1.2 Não circulante (imobilizado, depreciação acumulada)
2 Passivo
  2.1 Circulante (fornecedores, obrigações trabalhistas, impostos a recolher, empréstimos)
  2.3 Patrimônio líquido (capital social, lucros acumulados)
3 Receitas
  3.1 Receita bruta de vendas
  3.2 (-) Deduções: devoluções, impostos sobre vendas
4 Custos
  4.1 CMV / custo de produção (MP, embalagem, mão de obra, custos indiretos)
5 Despesas
  5.1 Comerciais (comissão, frete, marketing)
  5.2 Administrativas (pessoal, ocupação, serviços)
  5.3 Financeiras (juros, tarifas, taxas de cartão)
```

## Regras

- Código é imutável depois do primeiro lançamento. Reorganização usa conta nova e
  desativa a antiga, preservando o histórico.
- Conta com lançamento não pode ser excluída, só inativada (ver [soft-delete]).
- Toda conta analítica mapeia para o plano referencial da Receita (necessário no SPED).
- Cadastro novo sem centro de custo obrigatório definido gera alerta: despesa sem centro
  inviabiliza o gerencial (ver [centro-de-custo]).

## Seed

O [data-seeding] carrega uma versão inicial do plano acima. O contador da Pure.us ajusta
antes de qualquer lançamento em produção — mudar plano com movimento já registrado é
caro e arriscado.
