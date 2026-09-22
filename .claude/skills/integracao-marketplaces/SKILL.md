---
name: integracao-marketplaces
description: Integração com marketplaces no KAIROS (Mercado Livre, Amazon, Shopee, Magalu) — anúncios, estoque compartilhado, pedidos, comissões e conciliação de repasse. Use ao conectar canal de venda externo.
---

# Marketplaces

Canal relevante para cosméticos capilares. O risco central é **estoque compartilhado**:
vender o que já foi vendido em outro canal gera cancelamento, multa e queda de reputação.

## Modelo

```
canal_venda(id, tenant_id, tipo, nome, credenciais_ref, ativo)
canal_anuncio(id, canal_id, produto_id, id_externo, titulo, preco, estoque_publicado,
              situacao, sincronizado_em)
canal_pedido(id, canal_id, id_externo, pedido_id, situacao_externa, payload, recebido_em)
canal_repasse(id, canal_id, periodo, valor_bruto, comissoes, fretes, valor_liquido)
```

Todo registro guarda o `id_externo` e o payload original: quando o marketplace contestar
algo, o payload é a prova.

## Estoque

Regra: o KAIROS é a fonte da verdade. Nunca aceite o estoque do marketplace como
referência.

- Publique **saldo disponível menos reserva de segurança** (5 a 10%), não o saldo total.
- Sincronize a cada movimentação relevante, com debounce, e faça uma sincronização
  completa de madrugada.
- Venda que chega com estoque insuficiente vira pendência para decisão humana, nunca
  cancelamento automático.

Cada marketplace tem limite de chamadas por minuto. Respeite com fila e controle de
taxa; bloqueio por excesso derruba a integração inteira por horas.

## Pedidos

Chegam por webhook ou polling. Fluxo: recebe, deduplica por `id_externo`, cria ou
atualiza parceiro (consumidor final), cria o pedido já confirmado com o canal e a tabela
de preço correspondente, reserva estoque.

Particularidades: o cliente é consumidor final (NF-e com DIFAL, ver [difal]); o endereço
vem do marketplace e nem sempre é completo; o prazo de expedição é contratual e atrasar
derruba a reputação.

## Comissões e repasse

O valor que entra no banco não é o valor do pedido: descontam comissão, frete subsidiado,
taxa de parcelamento e eventuais reembolsos. Modelo:

```
valor_pedido - comissao - frete - taxas + subsidios = repasse
```

O título a receber é do marketplace, não do consumidor, e a baixa se dá pelo relatório de
repasse. Concilie repasse contra pedidos: é onde aparecem cobranças indevidas, e ninguém
percebe sem essa conferência.

## Cancelamento e devolução

Ocorrem com frequência alta. Devolução retorna estoque para **quarentena**, não para
disponível: cosmético que voltou do consumidor não pode ser revendido sem inspeção
(ver [estoque]).

## Escopo

Fase 3. Antes disso, pedido de marketplace entra pela API do KAIROS
(ver [api-design-rest]) ou por importação de planilha.
