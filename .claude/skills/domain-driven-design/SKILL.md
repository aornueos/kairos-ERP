---
name: domain-driven-design
description: Modelagem tática de DDD aplicada ao KAIROS. Use ao nomear conceitos do negócio, definir agregados e invariantes, ou quando um caso de uso começa a manipular várias entidades ao mesmo tempo.
---

# DDD no KAIROS

DDD tático de forma sóbria: agregados pequenos, linguagem única, sem CQRS nem event sourcing.

## Linguagem ubíqua (PT-BR no domínio, inglês só em infra)

| Termo | Significado na Pure.us |
|---|---|
| Produto | item comercializável (SKU) |
| Insumo | matéria-prima ou embalagem consumida na produção |
| Fórmula-mestra | receita padrão de um produto acabado |
| Ordem de produção | execução de uma fórmula em um lote |
| Lote | quantidade produzida ou recebida com validade e rastreabilidade |
| Parceiro | pessoa física ou jurídica que pode ser cliente, fornecedor ou ambos |
| Pedido | intenção de venda confirmada |
| Faturamento | geração do documento fiscal e financeiro do pedido |
| Título | contas a pagar ou receber |
| Baixa | liquidação total ou parcial de um título |

Nunca traduza esses termos no código. `OrdemProducao`, não `ProductionOrder`.

## Agregados e suas raízes

| Agregado | Raiz | Invariantes principais |
|---|---|---|
| Produto | `Produto` | SKU único por tenant; unidade de medida imutável após movimentação |
| Lote | `Lote` | saldo nunca negativo; validade obrigatória para acabado e insumo |
| Ordem de produção | `OrdemProducao` | só conclui com todos os insumos apontados |
| Pedido | `Pedido` | total igual à soma dos itens; não altera após faturado |
| Nota fiscal | `NotaFiscal` | imutável após autorizada; só cancelamento ou CC-e |
| Título | `Titulo` | soma das baixas menor ou igual ao valor do título |

Regra: uma transação altera um agregado. Efeito em outro agregado vai por evento.

## Invariantes vivem no domínio

```ts
// src/modules/estoque/domain/lote.ts
export class Lote {
  reservar(qtd: Decimal, em: Date) {
    if (this.validade <= em) throw new LoteVencidoError(this.numero)
    if (this.saldoDisponivel.lt(qtd)) throw new SaldoInsuficienteError(this.numero)
    this.reservado = this.reservado.plus(qtd)
  }
}
```

Se a regra puder ser burlada chamando o repositório direto, ela está no lugar errado.

## Value objects obrigatórios

`Cnpj`, `Cpf`, `Ncm`, `Cest`, `Dinheiro`, `Quantidade`, `Aliquota`, `ChaveAcesso`.
Validam no construtor e não aceitam estado inválido.

## Quando não usar DDD

Cadastro CRUD puro (UF, banco, motivo de perda) não precisa de agregado. Tabela, Zod e
repositório resolvem. Reserve o esforço para estoque, produção, faturamento e financeiro.
