# INSTRUCTIONS — KAIROS ERP

Documento de trabalho do projeto. Serve para retomar o desenvolvimento em outra máquina
ou por outra pessoa sem depender de conversa anterior. Atualize-o sempre que uma decisão
for tomada ou uma fase for concluída.

- Produto: **KAIROS** — ERP da **Pure.us**, indústria de cosméticos capilares
- Última atualização: 2026-09-22
- Estado: **fase 0 (fundação) concluída e verificada**; fase 1 é a próxima

---

## 1. Contexto do negócio

A Pure.us **fabrica e vende** cosméticos para cabelo (linhas de nutrição, reconstrução,
matização e finalização). O fluxo completo que o sistema precisa cobrir:

```
compra de insumo -> produção com fórmula-mestra -> estoque com lote e validade
-> venda por canal -> faturamento com nota fiscal -> financeiro -> contabilidade
```

Três características do negócio moldam quase toda decisão técnica:

1. **Lote e validade são obrigatórios.** Rastreabilidade ponta a ponta é exigência
   sanitária e condição para responder a um recall.
2. **Tributação de cosmético é pesada.** NCM 3305 (preparações capilares) tem
   substituição tributária na maioria das UFs; erro de cadastro gera passivo silencioso.
3. **O dinheiro precisa fechar.** Diferença de um centavo em rateio derruba a NF-e na
   SEFAZ e vira retrabalho no faturamento.

Escala de referência: dezenas de usuários, milhares de documentos por mês, uma a duas
pessoas desenvolvendo.

---

## 2. Decisões já tomadas

Registradas em ADR. Não as contrarie sem escrever um ADR novo.

| # | Decisão | Arquivo |
|---|---|---|
| 0001 | Stack Next.js + Prisma + PostgreSQL 16, monolito TypeScript | [docs/adr/0001](docs/adr/0001-stack-nextjs-prisma-postgres.md) |
| 0002 | Emissão fiscal por provedor externo (não direto na SEFAZ) | [docs/adr/0002](docs/adr/0002-emissao-fiscal-por-provedor-externo.md) |
| 0003 | Multi-tenancy por `tenant_id` com Row Level Security | [docs/adr/0003](docs/adr/0003-multi-tenancy-tenant-id-com-rls.md) |
| 0004 | Monolito modular; microsserviços rejeitados | [docs/adr/0004](docs/adr/0004-monolito-modular.md) |
| 0005 | Exceção de RLS para o bootstrap da autenticação | [docs/adr/0005](docs/adr/0005-excecao-de-rls-para-autenticacao.md) |

### Stack fixada

| Camada | Escolha |
|---|---|
| Runtime | Node 22+, TypeScript 6 estrito (ver ADR-0001 sobre TS 6 x 7) |
| Aplicação | Next.js 16 App Router (Server Actions internas, Route Handlers para API externa) |
| Banco | PostgreSQL 16 com Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Interface | Tailwind 4, React Hook Form, Zod 4 |
| Autenticação | Auth.js v5 (credenciais) + RBAC em banco |
| Filas | pg-boss (no próprio PostgreSQL) |
| Arquivos | S3-compatível: MinIO local, R2/S3 em produção |
| Observabilidade | Pino, OpenTelemetry, Sentry |
| Testes | Vitest, Testcontainers, Playwright |
| Entrega | Docker + GitHub Actions; produção em VPS com Docker Compose |

Fora de escopo por decisão: microsserviços, Redis na fase 1, GraphQL, cálculo próprio de
folha de pagamento, emissão fiscal direto na SEFAZ.

---

## 3. Passos já executados

1. Leitura do `CLAUDE.md` (diretrizes de engenharia, valem para todo trabalho no repo).
2. Levantamento das skills do `SKILLS.md` e verificação de quais existem nos catálogos
   oficiais desta conta.
3. Definição das quatro decisões estruturais com o responsável pelo produto.
4. Criação de **97 skills de projeto** em `.claude/skills/`, todas com frontmatter
   validado e referências cruzadas conferidas.
5. Criação dos ADRs 0001 a 0004.
6. **Fase 0 implementada e verificada** (seção 7), com o ADR-0005 registrando a única
   exceção de arquitetura que apareceu no caminho.

### Dois defeitos encontrados e corrigidos na fase 0

Valem registro porque nenhum dos dois apareceria em revisão de código — só rodando.

**A policy de RLS quebrava em vez de esconder.** Sem contexto de tenant,
`current_setting('app.tenant_id', true)` devolve string vazia, e `''::uuid` levanta erro
de sintaxe. Uma consulta que escapasse do helper de tenant recebia erro de banco em vez
de zero linhas. Corrigido com `nullif(...)`, que faz a comparação virar NULL e a consulta
devolver nada — que é o comportamento correto. Coberto por teste.

**O login não podia funcionar.** `usuario_tenant` é a tabela que diz a qual empresa a
pessoa pertence, e tinha RLS por tenant. No login ainda não se sabe o tenant, então a
policy escondia justamente a linha necessária: impasse de bootstrap. Resolvido com uma
policy adicional restrita a `SELECT` e a um contexto declarado em um único ponto do
código (ADR-0005), com teste fixando que ela não libera escrita nem as outras tabelas.

---

## 4. Skills: estado e catálogo

### 4.1 Skills oficiais listadas no SKILLS.md

| Skill | Situação |
|---|---|
| `skill-creator`, `xlsx`, `docx`, `pdf`, `pptx` | disponíveis no plugin `anthropic-skills` |
| `doc-coauthoring` | equivalente disponível: `anthropic-skills:docs` |
| `frontend-design`, `design-system` | já instaladas no perfil do usuário |
| `web-artifacts-builder` | equivalentes disponíveis: `artifact-design`, `artifact-capabilities` |
| `mcp-builder` | **não existe** no catálogo desta conta — criada versão local do projeto |
| `webapp-testing` | **não existe** no catálogo — criada versão local do projeto |
| `brand-guidelines` | **não existe** no catálogo — criada versão local (marca Pure.us) |
| `internal-comms` | **não existe** no catálogo — criada versão local |

Busca feita em `SearchPlugins` e `SearchSkills`; ambas retornaram vazio para as quatro
ausentes. Se um dia entrarem no catálogo, remova a versão local para não sombrear.

### 4.2 Skills de projeto criadas (97)

Todas em `.claude/skills/<nome>/SKILL.md`. Carregam automaticamente para qualquer sessão
aberta neste diretório.

**Arquitetura (8)**
`erp-architecture` `domain-driven-design` `modular-monolith` `multi-tenancy`
`event-driven` `api-design-rest` `api-versioning` `adr-writer`

**Banco de dados (7)**
`database-schema-design` `migrations` `query-optimization` `data-seeding`
`audit-trail` `soft-delete` `backup-restore`

**Backend (10)**
`backend-conventions` `auth-rbac` `permissions-matrix` `validation-rules`
`error-handling` `background-jobs` `caching` `file-storage` `notifications` `webhooks`

**Frontend (7)**
`kairos-design-system` `ui-components` `data-tables` `forms-builder` `dashboards`
`accessibility` `i18n-ptbr`

**Módulos ERP (20)**
`financeiro` `contas-pagar-receber` `fluxo-caixa` `conciliacao-bancaria` `contabilidade`
`plano-de-contas` `centro-de-custo` `estoque` `compras` `vendas` `pedidos` `faturamento`
`crm` `rh` `folha-pagamento` `producao-pcp` `logistica` `ativos-patrimonio` `projetos`
`relatorios-bi`

**Brasil e fiscal (17)**
`nfe` `nfse` `nfce` `cte` `mdfe` `sped-fiscal` `sped-contabil` `efd-reinf` `esocial`
`icms-st` `difal` `reforma-tributaria-ibs-cbs` `pix` `boleto` `cnab` `open-finance` `lgpd`

**Integrações (6)**
`integracao-bancos` `integracao-marketplaces` `integracao-ecommerce`
`integracao-gateways-pagamento` `import-export-csv` `sefaz-webservices`

**Qualidade (7)**
`unit-testing` `integration-testing` `e2e-testing` `kairos-code-review` `refactoring`
`kairos-security-review` `performance-testing`

**DevOps (6)**
`docker` `ci-cd` `observability-logs` `monitoring-alerts` `deploy-checklist` `env-config`

**Documentação (5)**
`technical-docs` `user-manual` `api-docs-openapi` `changelog` `onboarding-dev`

**Substituições locais de skills oficiais ausentes (4)**
`mcp-builder` `webapp-testing` `brand-guidelines` `internal-comms`

### 4.3 Três skills renomeadas, e por quê

Três nomes do `SKILLS.md` colidiriam com recursos já existentes e úteis, que ficariam
inacessíveis (skill de projeto sobrepõe a de usuário e o comando embutido):

| Nome no SKILLS.md | Nome adotado | Motivo |
|---|---|---|
| `design-system` | `kairos-design-system` | preserva a skill genérica de tokens já instalada no perfil |
| `code-review` | `kairos-code-review` | preserva o comando `/code-review` do Claude Code |
| `security-review` | `kairos-security-review` | preserva o comando `/security-review` |

As versões `kairos-*` cobrem o específico do projeto e apontam para a genérica quando ela
é a ferramenta certa.

---

## 5. Arquitetura

### 5.1 Contextos delimitados

```
identidade  cadastros  estoque  compras  producao  vendas  faturamento
fiscal  financeiro  contabil  crm  logistica  bi
```

### 5.2 Estrutura de pastas

```
src/
  app/(erp)/<rota>/page.tsx        telas, sem regra de negócio
  app/api/v1/                      API externa
  app/api/webhooks/<provedor>/     entrada de webhooks
  modules/<contexto>/
    domain/                        entidades, value objects, invariantes, eventos
    application/                   casos de uso, portas, DTOs Zod
    infra/                         repositórios Prisma, adapters, jobs
    ui/                            componentes do módulo
    index.ts                       API pública do módulo (única saída permitida)
  shared/{ui,lib,auth,db,errors,money,dates,i18n,config}
  workers/                         entrypoints pg-boss
prisma/{schema/,migrations/,seed/}
docs/{adr,arquitetura,modulos,operacao,integracoes,fiscal,lgpd}
tests/{unit,integration,e2e,contract,fixtures}
```

### 5.3 Regras de dependência

1. `domain` não importa nada fora de si.
2. `application` importa `domain`, nunca Prisma direto.
3. `infra` implementa as portas de `application`.
4. Módulo nunca importa interno de outro módulo: só o `index.ts` público ou evento.
5. Eventos entre contextos passam pela tabela outbox, gravada na mesma transação.

Aplicado por `no-restricted-imports` no ESLint, não só por acordo.

### 5.4 Fluxo central (faturamento)

```
transação:
  valida pedido, lotes e saldo reservado
  calcula tributos (porta do módulo fiscal)
  cria NotaFiscal PENDENTE com número e série
  converte reserva em saída de estoque
  gera títulos a receber pela condição de pagamento
  marca o pedido como FATURADO
  grava evento pedido.faturado na outbox
commit
fora da transação:
  job envia ao provedor fiscal; webhook traz autorização ou rejeição
```

A chamada ao provedor fiscal fica **fora** da transação. Esse é o ponto mais crítico do
sistema; leia a skill `faturamento` antes de alterar qualquer parte dele.

---

## 6. Modelo de domínio essencial

Entidades que precisam existir antes de qualquer tela. Detalhes de cada uma nas skills
dos módulos correspondentes.

```
tenant, usuario, usuario_tenant, perfil, perfil_permissao
parceiro (cliente/fornecedor/transportadora), parceiro_contato, parceiro_endereco
produto (acabado/insumo/embalagem), produto_variacao, unidade_medida
deposito, lote, saldo_lote, movimento_estoque, reserva_estoque
formula, formula_item, ordem_producao, op_insumo, op_apontamento, op_qualidade
pedido_compra, recebimento, recebimento_item
tabela_preco, tabela_preco_item, pedido, pedido_item
nota_fiscal, nota_fiscal_item, evento_fiscal
conta_financeira, natureza_financeira, titulo, movimento_financeiro
conta_contabil, centro_custo, lancamento_contabil, lancamento_partida
evento_outbox, evento_consumo, auditoria, arquivo, parametro
```

Convenções de tipo que não se negociam:

| Dado | Tipo |
|---|---|
| Dinheiro | `numeric(14,2)`, `Decimal` no código |
| Preço unitário e quantidade | `numeric(14,4)` |
| Alíquota | `numeric(7,4)` |
| Data e hora | `timestamptz` em UTC |
| Data pura (validade, competência) | `date` |
| Identificador | UUID v7 gerado na aplicação |

Nunca `float` para valor. Nunca `timestamp` sem fuso. Ver skill `database-schema-design`.

---

## 7. Roadmap

Cada fase termina com software em produção e usado. Fase que não é usada não terminou.

### Fase 0 — Fundação — CONCLUÍDA em 2026-09-22

- [x] Projeto Next.js com TypeScript estrito e ESLint com as regras de fronteira
- [x] `docker-compose.yml` (Postgres, MinIO, Mailpit) e `.env.example`
- [x] Prisma com schema por contexto, migration inicial e `scripts/check-rls.ts`
- [x] Contexto de tenant (`comTenant`) e policies de RLS forçadas em 10 tabelas
- [x] Auth.js v5, modelo de usuário, perfis e 48 permissões; matriz no seed
- [x] `shared/ui` com componentes base e tokens do design system (claro e escuro)
- [x] Logger estruturado com redação, hierarquia de erros e contexto de requisição
- [x] pg-boss com o publisher da outbox e a tela de Processos
- [x] Pipeline de CI: lint, tipos, unit, migrations, RLS, integração, build, E2E, segurança
- [x] Seed base: 27 UFs, 13 municípios, 10 NCMs, 16 CFOPs, 10 bancos, 9 unidades,
      tenant Pure.us, 7 perfis e o primeiro administrador

**Critério de aceite: atendido.** O login funciona ponta a ponta contra PostgreSQL real,
a tela inicial abre com a empresa e o usuário, e há teste de integração provando que o
tenant A não lê, não altera e não apaga dado do tenant B.

Não entrou (e não fazia parte do critério): MinIO e Mailpit não foram exercitados, porque
upload e e-mail só entram na fase 1.

### Fase 1 — Núcleo operacional (8 a 12 semanas)

O MVP definido com o negócio. Entrega em ordem de dependência:

0. **PRIORIDADE — Romaneio (tabela de pedido) em PDF e Excel.** Primeira coisa da
   fase 1, antecipada porque é a ferramenta de venda do comercial. Versão melhorada da
   planilha que a Pure.us já usa: mantém todas as colunas (código, EAN, CST/CSOSN, NCM,
   DUN-14, CEST, dimensões, produto, preço, preço com desconto, caixa master,
   quantidade, total), os blocos de cliente, condições de pagamento e desconto, e as
   cores por linha de produto. Acrescenta: numeração com código de barras, dados do
   fornecedor, fórmulas vivas no Excel com campos do cliente liberados e o resto
   protegido, contagem de caixas com alerta de caixa aberta, resumo com bruto,
   desconto e total, validação de EAN/DUN-14 e tabela em branco para o cliente
   preencher. Estado detalhado em [Romaneio: estado](#romaneio-estado).
1. **Cadastros**: parceiro, produto e insumo com controle de lote, unidades, depósitos,
   tabela de preços. Importação por planilha desde já.
2. **Estoque**: movimentação, saldo por lote, FEFO, custo médio, transferência,
   inventário, rastreabilidade.
3. **Compras**: pedido de compra, aprovação por alçada, recebimento com lote e validade,
   quarentena, entrada de nota por XML, custo de aquisição.
4. **Produção**: fórmula-mestra versionada, ordem de produção, apontamento, qualidade,
   rendimento, custo do lote.
5. **Vendas e pedidos**: pedido, tabela de preço, desconto com alçada, crédito do cliente,
   reserva de estoque, separação.
6. **Faturamento e fiscal**: cálculo de tributos com ST e DIFAL, emissão de NF-e pelo
   provedor, cancelamento, CC-e, guarda de XML, conferência diária.
7. **Financeiro**: contas a pagar e a receber, baixas, juros e multa, estorno, boleto e
   PIX, conciliação bancária, fluxo de caixa e DRE gerencial.
8. **Painéis e relatórios** dos módulos acima.

**Critério de aceite:** a Pure.us opera um mês inteiro no KAIROS — compra, produz, vende,
fatura, recebe e fecha o caixa — sem planilha paralela.

#### Romaneio: estado

Em andamento. Exemplo gerável sem banco nem login: `pnpm exemplo:romaneio [pasta]`
produz o romaneio de exemplo e a tabela em branco, em PDF e Excel.

Pronto e verificado:

- tabelas `linha_produto`, `produto`, `romaneio`, `romaneio_item` com RLS forçada e
  restrições no banco (migration `20260923120000_romaneio`);
- permissões `vendas.romaneio.ler`, `.criar` e `.cancelar`, com a matriz dos perfis;
- validação de EAN-13 e DUN-14 e derivação do DUN pelo EAN
  (`src/modules/cadastros/domain/gtin.ts`);
- cálculo do romaneio no domínio, idêntico às fórmulas do Excel
  (`src/modules/vendas/domain/calculo-romaneio.ts`);
- casos de uso e repositório do catálogo, com auditoria de alterações;
- geradores de PDF e Excel (`src/modules/vendas/infra/documentos/`), conferidos
  visualmente e, no caso do Excel, abertos e recalculados no próprio Excel;
- catálogo real transcrito da planilha (`prisma/seed/base/catalogo-pureus.ts`).

Falta:

- repositório e casos de uso do romaneio (gravar, numerar, cancelar, listar);
- telas: lista de romaneios, editor com totais ao vivo, catálogo de produtos e
  dados da empresa para o cabeçalho;
- rotas de download do PDF e do Excel;
- carga do catálogo no `seed:base`;
- testes de integração e E2E do fluxo completo.

A confirmar com a Pure.us:

- DUN-14 do produto 482: a planilha trazia "c"; pela regra dos demais, é
  `17898649053798`;
- grafias corrigidas: "Powe Dose" para "Power Dose" (481, 486) e "Leavei-in" para
  "Leave-in" (485);
- três produtos se chamam só "Power Dose 13ml", um por linha — ambíguo em nota fiscal;
- arquivo do logo (PNG) para `public/marca/logo.png`; sem ele, os documentos usam a
  marca em texto;
- CNPJ, IE e endereço reais da empresa (o seed usa valores provisórios);
- o CSOSN 101 em todos os produtos indica Simples Nacional — confirmar com o contador
  (pendência "Regime tributário" abaixo).

### Fase 2 — Consolidação (6 a 8 semanas)

- Contabilidade: lançamentos automáticos, fechamento de período, balancete
- SPED Fiscal e EFD-Contribuições
- CRM: carteira, funil com etapa de amostra, atividades
- NFC-e e PDV, se houver venda presencial
- Régua de cobrança, notificações, relatórios avançados e curva ABC
- MRP simplificado: sugestão de compra e de produção
- API pública v1 documentada em OpenAPI

### Fase 3 — Expansão (conforme demanda)

- Integração com e-commerce próprio e marketplaces
- Logística: frete, transportadora, rastreio, MDF-e
- RH e ponto; folha importada do escritório contábil
- Ativos e patrimônio com depreciação e manutenção
- Projetos de desenvolvimento de produto com custo e regulatório
- SPED Contábil, EFD-Reinf
- Servidor MCP para consultas por linguagem natural

### Transversal e contínuo

- Reforma tributária: acompanhar IBS/CBS a cada semestre com o contador
  (skill `reforma-tributaria-ibs-cbs`)
- Revisão de segurança trimestral (`kairos-security-review`)
- Ensaio de restauração de backup trimestral (`backup-restore`)

---

## 8. Como retomar em outra máquina

### 8.1 Pré-requisitos

Node 22+, pnpm, Docker, Git. Windows, macOS ou Linux.

Sem Docker na máquina? O PostgreSQL pode rodar a partir de binários portáveis, sem
privilégio de administrador: ver `docs/operacao/postgres-sem-docker.md`.

### 8.2 Clonar e preparar

```bash
git clone <repo> kairos-ERP
cd kairos-ERP
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:deploy
pnpm seed:base     # imprime a senha do admin uma única vez
pnpm dev           # em um terminal
pnpm worker        # em outro
```

Abra `http://localhost:3000` e entre com `admin@pureus.local` e a senha que o
`seed:base` imprimiu. Em produção o seed não cria usuário: use `pnpm admin:criar`.

Verificação de que está tudo certo:

```bash
pnpm verify        # lint + tipos + testes unitários
pnpm check:rls     # isolamento por tenant
pnpm test:int      # integração (exige banco; ver TEST_DATABASE_URL)
pnpm e2e           # jornadas críticas
```

Roteiro manual, com o que só olho humano confere:
[docs/operacao/testar-fase-0.md](docs/operacao/testar-fase-0.md).

`pnpm seed:demo` (massa fictícia da Pure.us) entra na fase 1.

### 8.3 Skills

As 97 skills estão versionadas em `.claude/skills/` e carregam sozinhas ao abrir uma
sessão neste diretório. Nada a instalar.

As oficiais (`xlsx`, `pdf`, `docx`, `pptx`, `skill-creator`, `docs`) vêm do plugin
`anthropic-skills` da conta; se estiverem faltando, instale o plugin pela interface.

### 8.4 Ordem de leitura para quem chega

1. `CLAUDE.md` — como se trabalha aqui
2. Este arquivo
3. `docs/adr/0001` a `0004`
4. Skill `erp-architecture`
5. Skill `domain-driven-design` (vocabulário do negócio — não pule)
6. Skill do módulo em que vai mexer

A skill `onboarding-dev` tem o roteiro completo, incluindo a primeira tarefa sugerida.

---

## 9. Convenções não negociáveis

Resumo do que reprova PR. Detalhes nas skills `kairos-code-review` e `backend-conventions`.

- `tenant_id` em toda tabela de negócio, com RLS habilitada e forçada; índices e
  unicidade começando por ele
- `Decimal` para dinheiro em todo o caminho; arredondamento só no fim; rateio com a sobra
  no último item
- Caso de uso valida entrada com Zod e verifica permissão explicitamente
- Nenhuma chamada HTTP externa dentro de transação de banco
- Efeito entre módulos por evento na outbox, gravado na mesma transação
- Movimento de estoque e financeiro são imutáveis: corrige-se por estorno
- Cálculo fiscal só no módulo `fiscal`, com regra buscada pela data da operação
- Sem segredo em código, log ou banco em texto puro; sem dado pessoal em log
- Migration compatível com a versão anterior do app (expand/contract)
- Toda tela trata carregando, vazio, erro e sem permissão

---

## 10. Pendências e decisões em aberto

Precisam de definição com a Pure.us e com o contador antes das fases indicadas.

| Tema | Pergunta | Necessário até |
|---|---|---|
| Provedor fiscal | Qual contratar? (custo por nota, cobertura de NFC-e, qualidade da API) | Fase 1, item 6 |
| Regime tributário | Simples Nacional, Lucro Presumido ou Real? Muda cálculo e crédito | Fase 1, item 6 |
| NCM, CEST e MVA | Confirmar por produto e por UF de destino com o contador | Fase 1, item 6 |
| Banco | Qual banco e quais recursos por API (boleto, PIX, extrato)? | Fase 1, item 7 |
| Plano de contas | Validar a estrutura referencial com o escritório contábil | Fase 1, item 7 |
| Comissão | Apurada no faturamento ou no recebimento? | Fase 1, item 5 |
| Custo | Confirmar tratamento de frete e impostos recuperáveis no custo médio | Fase 1, item 2 |
| Hospedagem | VPS com Docker Compose ou plataforma gerenciada? Define o `deploy-checklist` | Fase 0, fim |
| Venda presencial | Existe PDV, feira ou showroom? Define se NFC-e entra na Fase 2 | Fase 2 |
| Dados atuais | De onde vêm os saldos iniciais (planilha, sistema antigo)? | antes do go-live |

Registre cada resposta como ADR quando ela mudar arquitetura, ou em
`docs/fiscal/parametros.md` quando for parâmetro de negócio.

---

## 11. Registro de progresso

Atualize ao fim de cada etapa.

| Data | Etapa | Estado |
|---|---|---|
| 2026-09-22 | Skills do projeto (97) criadas e validadas | concluído |
| 2026-09-22 | ADRs 0001 a 0004 | concluído |
| 2026-09-22 | Desenho do ERP e roadmap | concluído |
| 2026-09-22 | Fase 0 — Fundação | concluído |
| 2026-09-22 | ADR-0005 (exceção de RLS para autenticação) | concluído |
| 2026-09-23 | Fase 1, item 0 — Romaneio: modelo, cálculo, PDF e Excel | em andamento |
| — | Fase 1 — Cadastros e estoque | próxima |

### Verificação executada na conclusão da fase 0

| Verificação | Resultado |
|---|---|
| `pnpm lint` | sem erros |
| `pnpm typecheck` | sem erros |
| `pnpm format:check` | conforme |
| `pnpm test` (unitários) | 31 passaram |
| `pnpm test:int` (integração, Postgres real) | 14 passaram |
| `pnpm check:rls` | 10 tabelas isoladas, 9 globais |
| `pnpm build` | 6 rotas compiladas |
| `pnpm e2e` (Playwright + axe) | 5 passaram |
| Login manual no navegador | entra, tela inicial abre com a empresa |
| Worker `pnpm worker` | sobe, registra a fila, processa job |

O ambiente de verificação desta máquina não tem Docker: o PostgreSQL 16.11 roda a partir
de binários portáveis (ver `docs/operacao/postgres-sem-docker.md`), com role da aplicação
`NOSUPERUSER NOBYPASSRLS` para que o isolamento seja testado de verdade. O CI continua
usando o serviço de PostgreSQL do runner.
