---
name: notifications
description: Notificações do KAIROS — in-app, e-mail e WhatsApp, com preferências, templates e antisspam. Use ao avisar usuário ou cliente sobre evento do sistema (NF autorizada, título vencendo, estoque mínimo, lote a vencer).
---

# Notificações

Canais: in-app (sino), e-mail (Resend) e WhatsApp (provedor via API oficial).
Push e SMS ficam fora da fase 1.

## Modelo

```
notificacao(id, tenant_id, destinatario_id, tipo, titulo, corpo, link,
            lida_em, criado_em)
notificacao_preferencia(tenant_id, usuario_id, tipo, in_app, email, whatsapp)
notificacao_envio(id, notificacao_id, canal, status, provedor_id, erro, tentativas)
```

O disparo nasce de evento de domínio (ver [event-driven]) e vira job por canal.
A regra de quem recebe é por permissão, não por lista fixa de e-mails: quem tem
`financeiro.titulo.ler` recebe alerta de vencimento.

## Catálogo (fase 1)

| Tipo | Gatilho | Destino | Canais |
|---|---|---|---|
| `nfe.autorizada` | autorização na SEFAZ | vendedor, financeiro | in-app |
| `nfe.rejeitada` | rejeição | fiscal, vendedor | in-app, e-mail |
| `nfe.cliente` | autorização | cliente | e-mail com XML e DANFE |
| `titulo.a_vencer` | 3 dias antes | financeiro | in-app, e-mail (resumo diário) |
| `titulo.vencido` | diário | financeiro | e-mail (resumo) |
| `estoque.minimo` | saldo abaixo do mínimo | compras, produção | in-app |
| `lote.a_vencer` | 90/60/30 dias da validade | estoque, comercial | in-app, e-mail |
| `pedido.bloqueado_credito` | bloqueio | vendedor, financeiro | in-app |
| `producao.op_concluida` | conclusão | produção, comercial | in-app |
| `integracao.falha` | job na dead letter | administradores | e-mail |

## Regras

- Agrupe. Alerta de vencimento vira um e-mail com a lista do dia, não um por título.
  Notificação demais treina o usuário a ignorar todas.
- Preferência por usuário e tipo, com padrão sensato. In-app nunca é desligável para
  alerta crítico de integração.
- Nunca notifique dentro da transação. Publique o evento; o job envia.
- Idempotência por `(tipo, entidadeId, destinatario, competencia)`: reprocessar job não
  reenvia e-mail.
- Toda notificação tem `link` para a tela exata do documento.

## E-mail

Template MJML ou React Email versionado em `src/modules/notificacoes/templates`.
Assunto sem ruído: `Pure.us — NF-e 12345 autorizada`. Remetente com domínio próprio,
SPF, DKIM e DMARC configurados, senão vai para spam e o financeiro perde prazo.
Anexo fiscal segue o XML e o PDF de verdade: cliente e contador precisam do arquivo.

## WhatsApp

Só com template aprovado e consentimento registrado (ver [lgpd]). Use para confirmação
de pedido e aviso de entrega ao cliente, não para marketing dentro do ERP.

## Falha de envio

Registrada em `notificacao_envio` com o erro do provedor, visível na tela de
integrações. Bounce permanente marca o e-mail do parceiro como inválido e alerta o
cadastro.
