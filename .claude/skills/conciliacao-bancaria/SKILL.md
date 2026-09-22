---
name: conciliacao-bancaria
description: Conciliação bancária no KAIROS — importação de extrato (OFX, CNAB retorno, Open Finance), regras de correspondência, tratamento de divergência e fechamento. Use ao implementar ou corrigir conciliação.
---

# Conciliação bancária

Compara o que o sistema registrou com o que o banco informa. Sem conciliação, o saldo do
ERP é opinião.

## Entradas

| Fonte | Uso |
|---|---|
| OFX | importação manual, funciona em todo banco |
| CNAB retorno (240/400) | baixa automática de boletos (ver [cnab]) |
| Open Finance / API do banco | extrato automático diário (ver [integracao-bancos]) |
| Extrato do gateway e do PIX | recebimentos de cartão e PIX |

Guarde o arquivo original e o hash: reimportar o mesmo extrato não pode duplicar nada.

## Modelo

```
extrato_importacao(id, tenant_id, conta_id, origem, periodo_inicio, periodo_fim,
                   arquivo_id, hash, importado_em)
extrato_lancamento(id, importacao_id, data, valor, tipo, descricao, documento,
                   id_externo, conciliado_com_id, situacao)
conciliacao_regra(id, tenant_id, conta_id, padrao_descricao, natureza_id, parceiro_id)
```

`id_externo` (FITID do OFX, endToEndId do PIX) é a chave de deduplicação.

## Correspondência automática

Em ordem, da mais segura para a mais frouxa:

1. identificador externo já vinculado (nosso número do boleto, txid do PIX);
2. valor e data exatos, com parceiro provável pela descrição;
3. valor exato com tolerância de 3 dias;
4. soma de vários títulos que fecha com um lançamento (pagamento agrupado);
5. regra cadastrada por padrão de descrição (tarifas, energia, aluguel).

Nível 1 e 2 conciliam sozinhos. Do 3 em diante, sugestão para o usuário confirmar.
Nunca concilie automaticamente por aproximação: erro de conciliação é pior que trabalho
manual, porque esconde o problema.

## Divergências

- Lançamento no banco sem correspondente: tarifa, IOF, rendimento, PIX recebido não
  identificado, débito desconhecido. O usuário classifica com natureza e o sistema
  aprende a regra.
- Título baixado sem lançamento no banco: baixa indevida ou pagamento não compensado.
- Valor diferente: juros, multa, desconto na liquidação, tarifa deduzida — ajuste o
  título com a diferença classificada.

Tela mostra as duas colunas lado a lado, com filtro "só pendentes" e ação de conciliar,
desfazer e criar lançamento a partir do extrato.

## Fechamento

Ao fechar o período da conta: `saldo_inicial + movimentos = saldo_final do extrato`.
Não fecha com pendência, salvo justificativa registrada. Período conciliado bloqueia
alteração dos movimentos envolvidos; desfazer exige permissão e cai em auditoria.

## Job diário

Importa o extrato do dia anterior por API, tenta conciliar e notifica o financeiro com o
resumo: conciliados automaticamente, sugestões e pendências. O objetivo é o financeiro
abrir a tela e ver poucas linhas, não o extrato inteiro.
