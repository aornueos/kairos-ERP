# Como testar a fase 0

Roteiro para conferir, com as próprias mãos, que a fundação do KAIROS funciona.
Leva cerca de dez minutos. Comandos em PowerShell, na raiz do repositório.

A fase 0 não tem módulo de negócio: não há produto, pedido nem nota. O que se
testa aqui é a base que todos os módulos vão usar — banco, isolamento por
empresa, login, permissões, fila e as verificações automáticas.

## 1. Ligar o banco

Com Docker:

```powershell
docker compose up -d
```

Sem Docker (caso desta máquina — ver [postgres-sem-docker.md](postgres-sem-docker.md)):

```powershell
& "$env:LOCALAPPDATA\kairos-pg\pgsql\bin\pg_ctl.exe" -D "$env:LOCALAPPDATA\kairos-pg\data" start
```

Confira o `.env.local`. Precisa ter `DATABASE_URL` e, para os testes de
integração, `TEST_DATABASE_URL` (as duas estão no `.env.example`).

## 2. Preparar o banco, se for a primeira vez

```powershell
pnpm install
pnpm db:deploy
pnpm seed:base
```

O `seed:base` imprime a senha do administrador **uma única vez**. Anote.
Perdeu? Crie outro administrador com senha escolhida por você:

```powershell
pnpm admin:criar
```

## 3. Verificação automática

Cinco comandos. Todos devem terminar sem erro.

| Comando | O que prova |
|---|---|
| `pnpm lint` | o código segue as regras, inclusive as fronteiras entre módulos |
| `pnpm typecheck` | não há erro de tipo |
| `pnpm test` | 31 testes de dinheiro e validação brasileira |
| `pnpm test:int` | 14 testes contra banco real: isolamento e login |
| `pnpm check:rls` | nenhuma tabela com `tenant_id` ficou sem proteção |

Atalho para os três primeiros: `pnpm verify`.

Esperado no `check:rls`:

```
RLS conferida: 10 tabela(s) isolada(s) por tenant, 9 global(is). Tudo certo.
```

Se aparecer uma tabela sem RLS, é falha de verdade: alguém criou tabela com
`tenant_id` e esqueceu a política. O CI barra.

## 4. Subir a aplicação

```powershell
pnpm dev                 # http://localhost:3000
pnpm worker              # em outro terminal
```

O `worker` deve registrar a fila e ficar esperando. Ele é quem vai publicar os
eventos da caixa de saída quando os módulos existirem.

## 5. Teste manual — o que só olho humano vê

Marque conforme confere:

- [ ] Abrir `http://localhost:3000` sem estar logado → **vai para `/login`**.
- [ ] Entrar com e-mail certo e senha errada → mensagem **"E-mail ou senha
      incorretos."**
- [ ] Entrar com e-mail que não existe → **a mesma mensagem, idêntica**. É de
      propósito: mensagem diferente entrega quais e-mails estão cadastrados.
- [ ] Errar a senha cinco vezes → a conta **bloqueia por quinze minutos**.
- [ ] Entrar com a senha correta → cai na tela inicial com **"Bom trabalho,
      &lt;seu nome&gt;"** e o nome da empresa na barra lateral.
- [ ] Menu **Processos** abre. Como nenhuma operação de negócio existe ainda, o
      esperado é o estado vazio: **"Nenhum evento registrado"**.
- [ ] `http://localhost:3000/api/health` responde
      `{"situacao":"ok","dependencias":{"banco":"ok"}}`.
- [ ] Trocar o tema do sistema operacional entre claro e escuro → a interface
      acompanha.
- [ ] Navegar a tela de login **só pelo teclado**, sem mouse, até enviar.
- [ ] Abrir uma rota que não existe, como `/nada` → página 404 do sistema, não
      erro cru.

## 6. Jornada automatizada

Os mesmos passos de acesso, automatizados:

```powershell
$env:E2E_SENHA = '<senha do administrador>'
pnpm e2e
```

Cinco testes, incluindo um de acessibilidade com axe. Sem `E2E_SENHA`, o teste
de login válido é pulado (os outros quatro rodam).

## 7. Provar o isolamento por empresa você mesmo

Esta é a garantia mais importante da fase 0, e dá para conferir na unha. No
`psql`, conectado como o usuário **`kairos`** (não como `postgres`, que é dono e
teria privilégio demais):

```sql
-- sem dizer qual é a empresa: não enxerga nada
select count(*) from perfil;          -- 0

-- declarando a empresa: enxerga só a dela
select set_config('app.tenant_id', '<id do tenant>', false);
select count(*) from perfil;          -- 7
```

O primeiro `count` retornar zero — e não erro — é o comportamento correto.

Para pegar o id do tenant:

```sql
select id, razao_social from tenant;
```

A tabela `auditoria` também é imutável: um gatilho recusa `UPDATE` e `DELETE`.
Como o gatilho é por linha e a tabela ainda está vazia na fase 0, o teste
precisa inserir antes. Tudo dentro de uma transação desfeita no fim:

```sql
begin;
select set_config('app.tenant_id', '<id do tenant>', true);

insert into auditoria (id, tenant_id, entidade, entidade_id, acao, ator_tipo)
values (gen_random_uuid(), '<id do tenant>', 'teste', gen_random_uuid(),
        'CRIACAO', 'SISTEMA');

update auditoria set acao = 'outra';
-- ERRO: auditoria e imutavel: UPDATE nao permitido

rollback;
```

## O que ainda não dá para testar

Não existe nesta fase, e não é defeito:

- cadastro de produto, cliente, fornecedor;
- estoque, compra, produção, venda;
- nota fiscal e financeiro;
- upload de arquivo (MinIO) e envio de e-mail (Mailpit) — os serviços estão
  configurados no `docker-compose.yml`, mas nenhum código da fase 0 os usa;
- trilha de auditoria alimentada de verdade: a tabela e o gatilho de
  imutabilidade existem, mas nenhum caso de uso grava nela ainda.

Ver [INSTRUCTIONS.md](../../INSTRUCTIONS.md) para o que entra na fase 1.
