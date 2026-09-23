# 0005 — Exceção de RLS para o bootstrap da autenticação

- Status: aceito
- Data: 2026-09-22
- Decisores: Raul (produto e engenharia)

## Contexto

O ADR-0003 determina que toda tabela com `tenant_id` tem Row Level Security forçada,
e o contexto vem de `set_config('app.tenant_id', ...)` por transação.

Ao implementar o login na fase 0, isso produziu um impasse concreto: `usuario_tenant` é a
tabela que liga pessoa a empresa. No momento do login ainda não se sabe qual é o tenant —
é exatamente essa linha que vai dizer. Com apenas a policy de isolamento, a consulta de
autenticação não encontra vínculo nenhum e **ninguém consegue entrar no sistema**.

O defeito não era teórico: o login falhou na primeira verificação manual, com a senha
correta, e o diagnóstico apontou zero vínculos visíveis.

## Decisão

`usuario_tenant` recebe uma segunda policy, permissiva e restrita:

```sql
CREATE POLICY autenticacao_vinculo ON usuario_tenant
  FOR SELECT
  USING (current_setting('app.autenticando', true) = 'on');
```

Policies permissivas são combinadas com OR. Portanto:

- com `app.tenant_id` definido (uso normal), vale o isolamento por tenant;
- com `app.autenticando = 'on'`, a leitura é liberada;
- sem nenhum dos dois, nada é visível.

O flag é definido em **um único ponto do sistema**: a função `authorize` em
`src/shared/auth/auth.ts`, dentro da transação da consulta de login. Sendo
`set_config(..., true)`, o valor é local à transação e não vaza pelo pool.

Escrita continua isolada: a policy é `FOR SELECT`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Tirar `usuario_tenant` da RLS, tratando como tabela global | Resolve o impasse, mas abre mão de defesa em profundidade numa tabela que carrega escopo de acesso (depósitos, filiais, carteira) |
| Função `SECURITY DEFINER` para a consulta de login | Não funciona com `FORCE ROW LEVEL SECURITY`: a policy se aplica ao dono da tabela também |
| Role separada com `BYPASSRLS` só para autenticação | Exige segundo pool de conexões e concessão de superusuário; custo operacional desproporcional ao porte |
| Guardar o tenant no próprio e-mail ou num identificador composto | Impede o mesmo usuário em mais de uma empresa, que é requisito do ADR-0003 |

## Consequências

Positivas: o login funciona sem abrir mão da RLS no uso normal; a exceção é explícita,
grepável por `app.autenticando` e coberta por teste.

Negativas: existe um caminho que lê `usuario_tenant` inteira. Se alguém definir o flag
fora do login, a tabela fica exposta naquela transação. Mitigações:

- a policy é apenas `SELECT`;
- o flag aparece em um único arquivo, e qualquer uso novo salta na revisão;
- `tests/integration/autenticacao-bootstrap.test.ts` fixa as duas metades do contrato:
  o login enxerga o vínculo, e o flag **não** libera escrita nem as outras tabelas do
  tenant.

## Revisão

Revisitar se surgir um segundo caso de bootstrap parecido. Dois já seriam sinal de que a
identidade deveria virar um contexto separado, com política própria, em vez de acumular
exceções.
