---
name: nfce
description: NFC-e (modelo 65) no KAIROS — venda ao consumidor final, PDV, feiras e eventos, contingência offline e CSC. Use ao implementar venda presencial ou ponto de venda.
---

# NFC-e

Venda presencial ao consumidor final: loja, feira de beleza, evento de salão, showroom.
Emitida pelo mesmo provedor externo da [nfe].

## Diferenças em relação à NF-e

| Aspecto | NFC-e |
|---|---|
| Destinatário | opcional; CPF só se o cliente pedir |
| Impressão | DANFE NFC-e reduzido, com QR Code |
| Autorização | síncrona, precisa ser rápida |
| Contingência offline | permitida, com transmissão posterior |
| CSC | código de segurança do contribuinte, por UF, obrigatório no QR Code |
| Valor | limite por UF para venda sem identificação do consumidor |

## PDV

Tela própria, otimizada para teclado e leitor de código de barras:

- leitura por GTIN ou SKU, quantidade por teclado, sem mouse;
- pagamento múltiplo (dinheiro, PIX, cartão, troco calculado);
- emissão em menos de 3 segundos, com impressão automática;
- identificação opcional do consumidor por CPF;
- cancelamento do item antes de fechar; cancelamento da nota em até 30 minutos.

Toda venda de PDV baixa estoque com lote (FEFO automático) e gera recebimento no
[financeiro] conforme a forma de pagamento.

## Contingência offline

Sem internet, a venda continua: emite em contingência offline, imprime o DANFE com a
indicação e transmite quando a conexão voltar, por job. Prazo legal para transmitir é
curto (24 horas na maioria das UFs) — o alerta de pendência precisa ser barulhento.

Requisito prático: o PDV precisa guardar a numeração local e nunca repetir número.
Use faixa de numeração reservada por terminal.

## CSC e QR Code

O CSC é segredo por UF e ambiente, guardado no gerenciador de segredos, nunca no banco em
texto puro nem no código. O QR Code é montado pelo provedor; o KAIROS apenas exibe e
imprime.

## Fiscalização

Cliente pode consultar a nota pelo QR Code. O DANFE precisa sair legível em impressora
térmica de 58 ou 80 mm. Teste a impressão real antes de levar para a feira: layout que só
funciona na tela é problema descoberto no pior momento.

## Escopo

Fase 2 do roadmap, quando houver venda presencial relevante. Se a Pure.us vender só por
atacado e e-commerce, NFC-e não é necessária e a NF-e ao consumidor resolve.
