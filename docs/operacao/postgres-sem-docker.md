# PostgreSQL local sem Docker

- Dono: engenharia
- Última revisão: 2026-09-22

O caminho padrão de desenvolvimento é `docker compose up -d` (ver `docker-compose.yml`).
Este documento é a alternativa para máquina sem Docker — que é o caso da estação em que
a fase 0 foi construída.

Usa os binários portáveis do PostgreSQL: não precisa de privilégio de administrador,
não instala serviço e não interfere em nada mais na máquina.

## Windows

```powershell
# 1. Baixar os binários (nao o instalador)
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.11-1-windows-x64-binaries.zip"
Invoke-WebRequest $url -OutFile "$env:TEMP\pg16.zip"
Expand-Archive "$env:TEMP\pg16.zip" -DestinationPath "$env:LOCALAPPDATA\kairos-pg"

$pg   = "$env:LOCALAPPDATA\kairos-pg\pgsql\bin"
$data = "$env:LOCALAPPDATA\kairos-pg\data"

# 2. Inicializar o cluster
Set-Content "$env:TEMP\pw.txt" "kairos_dev" -NoNewline -Encoding ascii
& "$pg\initdb.exe" -D $data -U postgres --pwfile="$env:TEMP\pw.txt" --encoding=UTF8
Remove-Item "$env:TEMP\pw.txt"

# 3. Subir
& "$pg\pg_ctl.exe" -D $data -l "$env:LOCALAPPDATA\kairos-pg\pg.log" -o "-p 5432" start
```

## Banco e role da aplicação

A role da aplicação **não pode** ser superusuária nem ter `BYPASSRLS`: com qualquer um
dos dois, o isolamento por tenant deixa de valer e os testes passam por engano.

```powershell
$env:PGPASSWORD = "kairos_dev"
& "$pg\psql.exe" -U postgres -h localhost -d postgres `
  -c "CREATE ROLE kairos LOGIN PASSWORD 'kairos' NOSUPERUSER NOCREATEDB NOBYPASSRLS;" `
  -c "CREATE DATABASE kairos      OWNER kairos ENCODING 'UTF8';" `
  -c "CREATE DATABASE kairos_test OWNER kairos ENCODING 'UTF8';"
```

Conferir que ficou correto:

```powershell
& "$pg\psql.exe" -U postgres -h localhost -d postgres -c `
  "select rolname, rolsuper, rolbypassrls from pg_roles where rolname='kairos';"
# esperado: kairos | f | f
```

## Ambiente

`.env.local`:

```
DATABASE_URL="postgresql://kairos:kairos@localhost:5432/kairos?schema=public"
```

Para os testes de integração, exporte também:

```
TEST_DATABASE_URL="postgresql://kairos:kairos@localhost:5432/kairos_test?schema=public"
```

Sem `TEST_DATABASE_URL`, a suíte de integração tenta subir um contêiner com
Testcontainers — que exige Docker. Com a variável definida, ela usa o banco indicado.

## Operação

```powershell
& "$pg\pg_ctl.exe" -D $data start      # subir
& "$pg\pg_ctl.exe" -D $data stop       # parar
& "$pg\pg_isready.exe" -p 5432         # conferir
Get-Content "$env:LOCALAPPDATA\kairos-pg\pg.log" -Tail 30   # log
```

Recriar do zero (perde os dados locais):

```powershell
& "$pg\psql.exe" -U postgres -h localhost -d postgres `
  -c "DROP DATABASE IF EXISTS kairos WITH (FORCE);" `
  -c "CREATE DATABASE kairos OWNER kairos ENCODING 'UTF8';"
pnpm db:deploy; pnpm seed:base
```

## Limitações

- Não sobe MinIO nem Mailpit. Upload de arquivo e envio de e-mail ficam indisponíveis
  até a fase 1, quando entram de fato; até lá não atrapalha.
- O CI continua usando o serviço de PostgreSQL do runner, não este procedimento.
- Instalar o Docker Desktop continua sendo o caminho recomendado quando for possível:
  aproxima o ambiente local do de produção.
