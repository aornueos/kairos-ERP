---
name: unit-testing
description: Testes unitários no KAIROS com Vitest — o que testar, como nomear, casos de borda de dinheiro e data, e o que não testar. Use ao escrever teste de domínio ou função pura.
---

# Testes unitários

Vitest. Alvo: regra de negócio no domínio e funções puras de cálculo. Rápido, sem banco,
sem rede.

## O que merece teste unitário

- Invariantes de agregado: `Lote.reservar`, `Pedido.confirmar`, `Titulo.baixar`.
- Cálculo fiscal: ICMS, ST, DIFAL, base reduzida, rateio de frete e desconto.
- Custo médio, rendimento de OP, explosão de fórmula.
- Vencimentos por condição de pagamento, dia útil, juros e multa.
- Validadores de CPF, CNPJ, IE, NCM, chave de acesso.
- Formatação e parsing pt-BR.

## O que não testar

Mapeamento Prisma, DTO trivial, getter, componente sem lógica. Teste que só repete a
implementação não pega defeito e trava refatoração.

## Forma

```ts
describe('Lote.reservar', () => {
  it('rejeita reserva de lote vencido', () => {
    const lote = umLote({ validade: new Date('2026-01-01'), saldo: '100' })
    expect(() => lote.reservar(dec('10'), new Date('2026-02-01')))
      .toThrow(LoteVencidoError)
  })
})
```

Nome do teste descreve o comportamento esperado, não o método. "rejeita reserva de lote
vencido" diz o que quebrou quando falha; "testa reservar" não diz nada.

Padrão: preparar, executar, verificar. Uma asserção conceitual por teste.

## Casos de borda obrigatórios

| Tema | Casos |
|---|---|
| Dinheiro | zero, negativo, arredondamento de 0,005, soma de parcelas fechando o total |
| Quantidade | zero, fracionária, unidade diferente da de estoque |
| Data | virada de mês e ano, fim de semana, feriado, fuso, ano bissexto |
| Texto | acento, caixa, espaço extra, string vazia, limite de tamanho |
| Coleção | vazia, um item, muitos itens |

Rateio é o caso clássico: distribuir R$ 100,00 entre 3 itens dá 33,33 + 33,33 + 33,34.
Teste que a soma bate com o total. É por aí que a NF-e é rejeitada.

## Tempo e aleatoriedade

Injetados, nunca globais. `ctx.agora()` e gerador de id são parâmetros. Teste que depende
de `new Date()` real falha em janeiro, na virada do mês ou às 21h de São Paulo.

## Cobertura

Meta: acima de 80% no domínio e nos cálculos fiscais e financeiros. Nas camadas de infra e
UI, cobertura alta não é objetivo. Perseguir percentual global produz teste inútil.
