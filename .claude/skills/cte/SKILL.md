---
name: cte
description: CT-e (conhecimento de transporte) no KAIROS — importação do documento emitido pela transportadora, conferência de frete e vínculo com a expedição. Use ao tratar frete contratado e custo de transporte.
---

# CT-e

A Pure.us contrata transporte; não é transportadora. Portanto **não emite** CT-e: recebe
o documento emitido pela transportadora.

## O que o KAIROS faz

1. Importa o XML do CT-e (por e-mail, upload ou consulta pela chave).
2. Vincula à expedição e às notas de venda transportadas.
3. Confere o valor do frete contra o cotado no pedido.
4. Gera o título a pagar da transportadora.
5. Registra o crédito de ICMS sobre frete, quando o regime permitir.
6. Guarda o XML por 5 anos.

## Conferência

```
frete cotado (pedido) x frete real (CT-e) -> diferença
```

Divergência acima da tolerância abre pendência para o financeiro decidir: aceitar,
contestar com a transportadora ou repassar ao cliente quando o frete for FOB.
Sem essa conferência, a transportadora cobra o que quiser e a diferença some na despesa.

## Vínculo com a nota

O CT-e referencia as chaves das NF-e transportadas. Use isso para calcular o custo real
de frete por pedido e por cliente, que alimenta o relatório de margem em
[relatorios-bi].

## Quando emitiríamos

Apenas se a Pure.us passasse a prestar transporte a terceiros. Nesse caso, emissão pelo
mesmo provedor da [nfe], com ADR próprio. Transporte com veículo próprio de mercadoria
própria não gera CT-e, mas pode exigir MDF-e (ver [mdfe]).
