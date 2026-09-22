---
name: internal-comms
description: Comunicação interna do projeto KAIROS — aviso de release, comunicado de incidente, mudança de processo e status para a diretoria da Pure.us. Use ao escrever qualquer mensagem sobre o sistema para a equipe.
---

# Comunicação interna

> Substitui localmente a skill oficial `internal-comms`, que não está disponível neste
> catálogo.

Público: equipe da Pure.us. Implantar ERP muda o trabalho das pessoas, e comunicação
ruim é o que faz um sistema correto ser rejeitado.

## Princípios

- Comece pelo efeito para quem lê, não pelo detalhe técnico.
- Uma mensagem, um assunto.
- Diga o que muda, quando, e o que a pessoa precisa fazer.
- Prazo e responsável explícitos.
- Sem jargão: "a emissão de nota ficou indisponível", não "o provedor retornou 503".

## Aviso de release

```
Assunto: KAIROS 1.4 — controle de validade por lote (a partir de 25/09)

O que muda
Ao vender, o sistema passa a sugerir sempre o lote que vence primeiro e bloqueia lote
vencido. Se precisar usar outro lote, informe o motivo.

Quem é afetado
Vendas e Expedição.

Quando
Quinta-feira, 25/09, a partir das 19h. Sem parada prevista.

O que fazer
Nada antes. Depois do dia 25, confira o lote sugerido na separação.

Dúvidas: <responsável>
```

## Comunicado de incidente

Durante, com atualização a cada 30 minutos:

```
Assunto: [Em andamento] Emissão de notas indisponível

Situação: a emissão está fora desde 14h10. Pedidos e estoque funcionam normalmente.
Impacto: não é possível faturar. Os pedidos ficam prontos e serão faturados em seguida.
O que fazer: continue lançando pedidos normalmente.
Próxima atualização: 15h00.
```

Depois, o fechamento: o que aconteceu, o que foi afetado, o que foi feito e o que evita a
repetição. Sem culpado, com ação e responsável.

Nunca diga "resolvido" antes de confirmar. Nunca minimize impacto que o usuário viveu.

## Status para a diretoria

Quinzenal, meia página: o que entrou em produção, o que está em andamento, o que
travou e o que se precisa decidir. Comparação com o prazo combinado, sem maquiar atraso —
atraso escondido vira crise no fim da fase.

## Mudança de processo

Quando o sistema muda como a pessoa trabalha, o aviso vem antes, com treinamento
oferecido e um período de apoio próximo. Ver [user-manual].

## Canais

Release e mudança de processo: e-mail ou comunicado no sistema (tela de novidades).
Incidente em andamento: canal rápido (grupo da equipe) com registro por e-mail depois.
Status: documento, para ficar consultável.
