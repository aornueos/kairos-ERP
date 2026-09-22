---
name: forms-builder
description: Padrão de formulários do KAIROS — schema compartilhado, campos com itens, rascunho, erros e fluxo de teclado. Use ao criar tela de cadastro ou documento (pedido, nota, título, ordem de produção).
---

# Formulários

React Hook Form + Zod, com o mesmo schema usado no caso de uso (ver [validation-rules]).
Zero duplicação de regra entre cliente e servidor.

```ts
const form = useForm<z.infer<typeof pedidoSchema>>({
  resolver: zodResolver(pedidoSchema),
  defaultValues,
  mode: 'onBlur',
})
```

`onBlur` para validar, não `onChange`: validar a cada tecla é ruído e atrapalha quem
digita rápido.

## Layout de documento

```
Cabeçalho    parceiro, data, condição de pagamento, vendedor
Itens        grade editável com totalizador
Totais       produtos, desconto, frete, impostos, total geral
Abas         Observações · Anexos · Fiscal · Histórico
Rodapé fixo  [Cancelar]                 [Salvar rascunho] [Confirmar]
```

Grade de itens é o coração da tela de venda e compra. Requisitos:

- Enter confirma o item e abre a próxima linha em branco.
- Seleção de produto por código, SKU ou nome, com foco já no campo.
- Quantidade, preço e desconto recalculam o total do item na hora.
- Escolha de lote obrigatória quando o produto é controlado por lote, sugerindo o de
  validade mais próxima (FEFO) — ver [estoque].
- Excluir linha pede confirmação apenas se ela já foi persistida.

## Rascunho e perda de trabalho

Documento longo salva rascunho automático a cada 30 segundos e ao trocar de aba.
Sair com alteração pendente avisa. Perder meia hora de digitação de pedido é o tipo de
erro que faz o usuário voltar para a planilha.

## Erros

Erro de campo aparece junto ao campo, em vermelho, com texto que diz o que fazer.
Erro global vai para o topo do formulário com foco programático e lista dos campos com
problema, cada um clicável. Erro vindo do servidor é mapeado pelo caminho do campo
(`itens.2.quantidade`) automaticamente.

## Submissão

Botão desabilitado enquanto envia, com indicador. Evite duplo lançamento com
`Idempotency-Key` em documento financeiro ou fiscal. Depois de salvar: mensagem curta e
continuidade — em cadastro repetitivo, limpar o formulário e manter o foco no primeiro
campo é melhor que redirecionar para a lista.

## Campos brasileiros

CPF/CNPJ com máscara na exibição e dígitos limpos no estado. Busca de CNPJ preenchendo
razão social e endereço, com confirmação do usuário. CEP preenchendo endereço.
Moeda com separador pt-BR e cursor estável durante a digitação.

## Teclado

Tab segue a ordem visual. `Ctrl+Enter` confirma o documento. `Esc` fecha diálogo sem
descartar dado digitado sem perguntar. Campo de data aceita digitação (`21/09/26`) além
do seletor.
