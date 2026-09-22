---
name: user-manual
description: Manual do usuário do KAIROS — estrutura por tarefa, linguagem, ajuda contextual e treinamento da equipe da Pure.us. Use ao escrever material para quem opera o sistema.
---

# Manual do usuário

Quem lê é a equipe da Pure.us: comercial, financeiro, produção, estoque e diretoria.
Não são pessoas de tecnologia e estão com pressa.

## Estrutura por tarefa

Organize pelo que a pessoa quer fazer, não pelo menu do sistema:

```
Primeiros passos
  Entrar no sistema · Conhecer a tela · Trocar senha e ativar o segundo fator
Vendas
  Cadastrar um cliente · Criar um pedido · Aplicar desconto · Faturar
  O que fazer quando a nota é rejeitada
Estoque
  Conferir saldo · Entrada por compra · Controlar lote e validade · Fazer inventário
Produção
  Cadastrar fórmula · Abrir ordem de produção · Apontar · Concluir e liberar o lote
Financeiro
  Lançar conta a pagar · Baixar título · Conciliar o banco · Fechar o dia
Relatórios
  DRE gerencial · Fluxo de caixa · Curva ABC
Perguntas frequentes
```

## Estilo

- Segunda pessoa e voz ativa: "Clique em Faturar", não "deve-se clicar".
- Um passo por linha, numerado, com o rótulo exato do botão entre aspas.
- Captura de tela apenas onde a descrição não basta, com destaque no ponto certo.
- Explique **por que** quando importa: "A reserva vale 72 horas para não travar estoque
  de pedido parado."
- Sem jargão: "código do produto", não "SKU" (a não ser que a equipe já use SKU).
- Diga o que **não** fazer nos pontos perigosos, com a consequência: "Não cancele a nota
  depois de 24 horas: é preciso emitir devolução."

## Ajuda contextual

Melhor que manual separado é ajuda na tela: texto curto no campo difícil, link "Como
funciona?" abrindo o trecho certo do manual, e mensagem de erro que já explica o caminho
(ver [i18n-ptbr]).

Toda mensagem de erro de negócio deve ser compreensível sem consultar o manual. Se
precisa de manual, a mensagem está ruim.

## Treinamento

Roteiro por perfil, com base no ambiente de demonstração ([data-seeding]):

| Perfil | Duração | Conteúdo |
|---|---|---|
| Vendas | 2 h | pedido, desconto, crédito, faturamento |
| Estoque | 3 h | entrada, lote, FEFO, inventário, transferência |
| Produção | 3 h | fórmula, OP, apontamento, qualidade |
| Financeiro | 4 h | títulos, baixas, conciliação, relatórios |
| Diretoria | 1 h | painéis e relatórios |

Treinamento em ambiente de demonstração, com a massa da Pure.us. Ninguém aprende ERP
lendo: aprende fazendo, errando e desfazendo.

## Manutenção

Manual desatualizado gera chamado. Mudança de fluxo atualiza o trecho correspondente no
mesmo ciclo do release, e o [changelog] em linguagem de usuário aponta o que mudou.
