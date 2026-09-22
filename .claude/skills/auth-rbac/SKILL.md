---
name: auth-rbac
description: Autenticação e controle de acesso do KAIROS (Auth.js v5, sessão, perfis, permissões, escopo por depósito ou filial). Use ao proteger rota, ação ou dado, e ao mexer em login, senha ou sessão.
---

# Autenticação e RBAC

Auth.js v5 com provider de credenciais. Sem login social: usuário de ERP é funcionário
cadastrado pelo administrador do tenant.

## Modelo

```
usuario           (global, pode pertencer a vários tenants)
usuario_tenant    (vínculo + situação + perfis)
perfil            (por tenant: Administrador, Financeiro, Vendas, Produção, Estoque, Fiscal, Leitura)
perfil_permissao  (perfil -> permissão)
usuario_permissao (concessão ou revogação pontual, exceção auditada)
```

Permissão é string `<modulo>.<recurso>.<acao>`: `financeiro.titulo.baixar`,
`vendas.pedido.aprovar_desconto`. Lista completa em [permissions-matrix].

## Senha e sessão

- Hash com Argon2id (`argon2` npm), parâmetros no `.env`, nunca bcrypt novo.
- Mínimo 12 caracteres, verificação contra lista de senhas vazadas no cadastro.
- Sessão JWT de 8 horas com rotação; refresh só enquanto o vínculo estiver ativo.
- MFA (TOTP) obrigatório para perfis com permissão financeira ou de administração.
- Bloqueio progressivo após 5 falhas por usuário e por IP; sempre registrado em auditoria.
- Troca de senha, e-mail ou MFA invalida todas as sessões ativas.

## Verificação em três camadas

1. **Middleware**: sessão válida e tenant ativo; redireciona para login.
2. **Caso de uso**: `ctx.exigirPermissao('...')` — é aqui que a decisão realmente acontece.
3. **Dados**: RLS por `tenant_id` (ver [multi-tenancy]) e escopo adicional quando houver.

Esconder botão na UI é usabilidade, não segurança. Toda Server Action valida de novo.

## Escopo além do tenant

Vendedor vê apenas os próprios pedidos e clientes da sua carteira; conferente opera
apenas os depósitos atribuídos. Escopo fica em `usuario_tenant.escopo` (JSON com
`depositos`, `filiais`, `carteira`) e é aplicado como filtro obrigatório no repositório,
não como opção do chamador.

## Troca de tenant

Usuário com mais de um vínculo escolhe o tenant no login. A troca gera sessão nova e
registra auditoria. O `tenantId` vem sempre da sessão no servidor, nunca de parâmetro da
requisição.

## Tokens de API

Emitidos por tenant, com escopos explícitos e validade máxima de 1 ano. Guardados como
hash. Exibidos uma única vez na criação. Revogáveis na hora e listados com data do último
uso.
