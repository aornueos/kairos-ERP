---
name: kairos-security-review
description: Revisão de segurança específica do KAIROS — isolamento de tenant, segredos, fraude financeira, upload, SSRF e dados fiscais. Use antes de subir mudança sensível ou em revisão periódica.
---

# Revisão de segurança do KAIROS

> Para a varredura genérica, use o comando `/security-review`. Esta skill cobre os riscos
> deste sistema.

## 1. Isolamento de tenant (risco mais grave)

- Toda tabela de negócio com `tenant_id`, RLS habilitada **e** forçada.
- `tenantId` vem sempre da sessão no servidor, nunca de parâmetro da requisição.
- Chave de cache, chave de job e nome de arquivo no S3 incluem o tenant.
- Teste automatizado de vazamento entre tenants em cada módulo.
- Consulta com `$queryRaw` usando parâmetros, nunca interpolação de string.

Vazamento entre tenants é o incidente que acaba com o produto. Trate como P0.

## 2. Segredos

Certificado A1, CSC da NFC-e, credenciais bancárias, tokens de provedor e chave PIX ficam
no gerenciador de segredos. Nunca no repositório, no `.env` versionado, no banco em texto
puro ou em log. Rotação documentada e alerta de validade.

Varredura de segredo no CI (gitleaks) bloqueando o merge.

## 3. Fraude financeira interna

O ERP é alvo. Controles mínimos:

- Alteração de dados bancários de fornecedor: dupla confirmação, auditoria, e comparação
  na geração da remessa (ver [cnab]).
- Segregação de funções na matriz de permissões, com alerta de acúmulo
  (ver [permissions-matrix]).
- Aprovação de pagamento separada da montagem da remessa.
- Ajuste manual de estoque e estorno de baixa com permissão própria e motivo obrigatório.
- Relatório periódico de exceções: descontos acima do limite, estornos, ajustes,
  cancelamentos, liberações de crédito.

## 4. Autenticação

Argon2id, MFA para perfis financeiros e administrativos, bloqueio progressivo, sessão de
8 horas com rotação, invalidação de sessões ao trocar senha. Token de API com escopo
mínimo e validade.

## 5. Entrada e saída

- Validação Zod em toda fronteira, inclusive Server Action.
- Upload: tipo por conteúdo, limite de tamanho, sem SVG ou HTML em anexo, antivírus
  quando disponível.
- SSRF: webhook de saída e busca de URL bloqueiam faixa privada, localhost e endpoint de
  metadados da nuvem.
- XSS: nada de `dangerouslySetInnerHTML` com conteúdo de usuário. Descrição de produto
  com HTML passa por sanitização.
- Cabeçalhos: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- Rate limit por IP e por token na API pública.

## 6. Dados pessoais e fiscais

Dado pessoal fora de log e de mensagem de erro. XML fiscal em bucket privado com URL
assinada de curta duração. Exportação de base registrada em auditoria. Ver [lgpd].

## 7. Dependências e infraestrutura

`pnpm audit` e Dependabot no CI, imagem Docker sem root, sem porta de banco exposta à
internet, backup testado (ver [backup-restore]).

## Rotina

Revisão completa a cada trimestre e sempre que mudar autenticação, permissão, integração
financeira ou tratamento de arquivo. Resultado em `docs/seguranca/revisoes/AAAA-MM.md`,
com pendências e prazo.
