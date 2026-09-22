---
name: validation-rules
description: Validação de entrada no KAIROS com Zod, incluindo documentos brasileiros (CPF, CNPJ, IE, CEP, NCM, chave de acesso) e regras de negócio. Use ao criar formulário, caso de uso, importação ou endpoint.
---

# Validação

Três camadas, com papéis distintos:

| Camada | Responsabilidade |
|---|---|
| Formulário (React Hook Form + Zod) | feedback imediato, formato |
| Caso de uso (mesmo schema Zod) | fronteira de confiança real |
| Banco (`not null`, `check`, `unique`) | última linha de defesa |

O schema Zod é compartilhado entre formulário e caso de uso. Um schema, uma verdade.

## Regras

- Valide na entrada do caso de uso, sempre, mesmo vindo de Server Action interna.
- `z.strictObject` por padrão: campo desconhecido é erro, não silêncio.
- Normalize antes de validar: trim, remoção de máscara, upper em UF e placa.
- Mensagem em português, dirigida ao usuário: "Informe o CNPJ do fornecedor", não
  "campo inválido".
- Validação de negócio que depende de banco (crédito, saldo, duplicidade) não é Zod:
  mora no domínio ou no caso de uso e lança erro de negócio.

## Validadores brasileiros

`src/shared/validacao/br.ts`:

```ts
export const cnpj = z.string().transform(sd).refine(validaCnpj, 'CNPJ inválido')
export const cpf  = z.string().transform(sd).refine(validaCpf, 'CPF inválido')
export const cep  = z.string().transform(sd).length(8, 'CEP deve ter 8 dígitos')
export const ncm  = z.string().transform(sd).length(8, 'NCM deve ter 8 dígitos')
export const chaveAcesso = z.string().transform(sd).length(44).refine(dvChave, 'Chave inválida')
```

`sd` remove tudo que não é dígito. Guarde sempre sem máscara.

Pontos que costumam escapar:

- CNPJ alfanumérico entra em vigor em 2026: o validador já aceita letras nas 12 primeiras
  posições e calcula o DV pela tabela nova. Não use regex de dígitos puros.
- Inscrição estadual tem regra por UF; use tabela de validadores por UF e permita
  "ISENTO".
- Consumidor final sem documento é válido em NFC-e: CPF opcional, não vazio obrigatório.
- CEP existe mas pode não bater com o município: consulte, não confie.

## Regras de negócio típicas da Pure.us

- Lote com validade menor que hoje não pode entrar em pedido nem em produção.
- Produto controlado por lote exige lote informado em toda movimentação.
- Desconto acima do limite do perfil exige permissão de aprovação.
- Cliente com título vencido acima de N dias bloqueia novo pedido, salvo liberação
  registrada com justificativa.
- Quantidade sempre maior que zero; devolução usa tipo de movimento próprio, não
  quantidade negativa.

## Erro de validação para a UI

```ts
{ codigo: 'VALIDACAO', campos: { 'itens.0.quantidade': 'Deve ser maior que zero' } }
```

O caminho do campo segue exatamente o nome do input para o formulário destacar sozinho.
Ver [error-handling] e [forms-builder].
