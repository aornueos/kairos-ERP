---
name: open-finance
description: Open Finance no KAIROS — consentimento, extrato automático, iniciação de pagamento e alternativas por API direta do banco. Use ao automatizar leitura de extrato ou pagamento.
---

# Open Finance

Permite ler extrato e iniciar pagamento com consentimento do titular, por padrão regulado
pelo BACEN. Reduz a dependência de CNAB e de importação manual de OFX.

## Papel realista para a Pure.us

Ser participante regulado do Open Finance não faz sentido para uma indústria pequena.
Os caminhos viáveis são:

1. **API direta do banco** (Itaú, BB, Sicoob, Inter): extrato, boleto e PIX por API
   própria, com certificado e OAuth2. É o caminho principal.
2. **Agregador** (Pluggy, Belvo, Klavi): um contrato cobre vários bancos, com
   consentimento do cliente. Bom quando há contas em bancos diferentes.

A decisão entre os dois vale um ADR. Critérios: quantos bancos, custo por conta, qualidade
do dado e prazo de suporte.

## Consentimento

- Prazo definido (até 12 meses), renovação explícita, e revogação a qualquer momento.
- Guarde o registro do consentimento: quem autorizou, quando, escopo e validade.
- Alerta 15 dias antes do vencimento: consentimento expirado derruba a conciliação
  automática em silêncio, e o financeiro só descobre no fechamento.

## Uso

| Recurso | Aplicação |
|---|---|
| Extrato (accounts, transactions) | conciliação bancária diária automática |
| Saldo | painel de tesouraria em tempo quase real |
| Iniciação de pagamento | pagar fornecedor sem arquivo CNAB |
| Dados de recebíveis de cartão | antecipação e conciliação de gateway |

## Implementação

Cada provedor é um adapter atrás de uma porta `ContaBancariaProvider`, com os métodos
`extrato(periodo)`, `saldo()` e `iniciarPagamento(...)`. Trocar de banco ou de agregador
não pode tocar o módulo financeiro.

Job diário busca o extrato do dia anterior e chama a conciliação
(ver [conciliacao-bancaria]). Falha na API não pode bloquear o fechamento: o sistema cai
para importação manual de OFX e avisa.

## Segurança

Credenciais e certificados no gerenciador de segredos, com rotação e alerta de validade.
Escopo mínimo: se só precisamos ler extrato, não peça permissão de pagamento.
Toda iniciação de pagamento exige aprovação humana no KAIROS, com dupla verificação de
valor e favorecido, e cai em [audit-trail].
