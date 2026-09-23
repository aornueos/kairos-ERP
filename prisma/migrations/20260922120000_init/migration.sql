-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "AmbienteTenant" AS ENUM ('PRODUCAO', 'HOMOLOGACAO', 'DEMONSTRACAO');

-- CreateEnum
CREATE TYPE "SituacaoVinculo" AS ENUM ('ATIVO', 'SUSPENSO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoAtor" AS ENUM ('USUARIO', 'TOKEN_API', 'JOB', 'IMPORTACAO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "TipoParametro" AS ENUM ('TEXTO', 'NUMERO', 'DECIMAL', 'BOOLEANO', 'DATA', 'JSON');

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" VARCHAR(14) NOT NULL,
    "inscricao_estadual" VARCHAR(20),
    "inscricao_municipal" VARCHAR(20),
    "regime_tributario" "RegimeTributario" NOT NULL,
    "ambiente" "AmbienteTenant" NOT NULL DEFAULT 'PRODUCAO',
    "municipio_ibge" VARCHAR(7),
    "logradouro" TEXT,
    "numero" VARCHAR(20),
    "complemento" TEXT,
    "bairro" TEXT,
    "cep" VARCHAR(8),
    "telefone" VARCHAR(20),
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "mfa_segredo" TEXT,
    "mfa_ativo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "falhas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMPTZ(3),
    "ultimo_acesso_em" TIMESTAMPTZ(3),
    "senha_alterada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_tenant" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "situacao" "SituacaoVinculo" NOT NULL DEFAULT 'ATIVO',
    "escopo" JSONB,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_permissao" (
    "tenant_id" UUID NOT NULL,
    "perfil_id" UUID NOT NULL,
    "permissao" VARCHAR(80) NOT NULL,

    CONSTRAINT "perfil_permissao_pkey" PRIMARY KEY ("perfil_id","permissao")
);

-- CreateTable
CREATE TABLE "usuario_tenant_perfil" (
    "tenant_id" UUID NOT NULL,
    "usuario_tenant_id" UUID NOT NULL,
    "perfil_id" UUID NOT NULL,

    CONSTRAINT "usuario_tenant_perfil_pkey" PRIMARY KEY ("usuario_tenant_id","perfil_id")
);

-- CreateTable
CREATE TABLE "usuario_permissao" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "permissao" VARCHAR(80) NOT NULL,
    "concedida" BOOLEAN NOT NULL,
    "motivo" TEXT NOT NULL,
    "criado_por" UUID,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entidade" VARCHAR(60) NOT NULL,
    "entidade_id" UUID NOT NULL,
    "acao" VARCHAR(30) NOT NULL,
    "ator_tipo" "TipoAtor" NOT NULL,
    "ator_id" UUID,
    "origem" VARCHAR(120),
    "antes" JSONB,
    "depois" JSONB,
    "ocorrido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_outbox" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tipo" VARCHAR(80) NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "agregado_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "ocorrido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicado_em" TIMESTAMPTZ(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimo_erro" TEXT,

    CONSTRAINT "evento_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_consumo" (
    "tenant_id" UUID NOT NULL,
    "tipo" VARCHAR(80) NOT NULL,
    "agregado_id" UUID NOT NULL,
    "consumidor" VARCHAR(80) NOT NULL,
    "consumido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_consumo_pkey" PRIMARY KEY ("tipo","agregado_id","consumidor")
);

-- CreateTable
CREATE TABLE "parametro" (
    "tenant_id" UUID NOT NULL,
    "chave" VARCHAR(80) NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" "TipoParametro" NOT NULL,
    "descricao" TEXT,
    "alterado_por" UUID,
    "alterado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parametro_pkey" PRIMARY KEY ("tenant_id","chave")
);

-- CreateTable
CREATE TABLE "arquivo" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "tipo_mime" VARCHAR(120) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "hash_sha256" VARCHAR(64) NOT NULL,
    "entidade" VARCHAR(60),
    "entidade_id" UUID,
    "criado_por" UUID,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uf" (
    "sigla" CHAR(2) NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo_ibge" VARCHAR(2) NOT NULL,
    "regiao" VARCHAR(20) NOT NULL,

    CONSTRAINT "uf_pkey" PRIMARY KEY ("sigla")
);

-- CreateTable
CREATE TABLE "municipio" (
    "codigo_ibge" VARCHAR(7) NOT NULL,
    "nome" TEXT NOT NULL,
    "uf_sigla" CHAR(2) NOT NULL,
    "capital" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("codigo_ibge")
);

-- CreateTable
CREATE TABLE "ncm" (
    "codigo" VARCHAR(8) NOT NULL,
    "descricao" TEXT NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,

    CONSTRAINT "ncm_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "cfop" (
    "codigo" VARCHAR(4) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,

    CONSTRAINT "cfop_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "banco" (
    "codigo" VARCHAR(3) NOT NULL,
    "nome" TEXT NOT NULL,
    "ispb" VARCHAR(8),

    CONSTRAINT "banco_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "unidade_medida" (
    "codigo" VARCHAR(6) NOT NULL,
    "descricao" TEXT NOT NULL,
    "decimais" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "unidade_medida_pkey" PRIMARY KEY ("codigo")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_cnpj_key" ON "tenant"("cnpj");

-- CreateIndex
CREATE INDEX "tenant_ativo_idx" ON "tenant"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_ativo_idx" ON "usuario"("ativo");

-- CreateIndex
CREATE INDEX "usuario_tenant_tenant_id_situacao_idx" ON "usuario_tenant"("tenant_id", "situacao");

-- CreateIndex
CREATE INDEX "usuario_tenant_usuario_id_idx" ON "usuario_tenant"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_tenant_tenant_id_usuario_id_key" ON "usuario_tenant"("tenant_id", "usuario_id");

-- CreateIndex
CREATE INDEX "perfil_tenant_id_ativo_idx" ON "perfil"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_tenant_id_codigo_key" ON "perfil"("tenant_id", "codigo");

-- CreateIndex
CREATE INDEX "perfil_permissao_tenant_id_permissao_idx" ON "perfil_permissao"("tenant_id", "permissao");

-- CreateIndex
CREATE INDEX "usuario_tenant_perfil_tenant_id_perfil_id_idx" ON "usuario_tenant_perfil"("tenant_id", "perfil_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_permissao_tenant_id_usuario_id_permissao_key" ON "usuario_permissao"("tenant_id", "usuario_id", "permissao");

-- CreateIndex
CREATE INDEX "auditoria_tenant_id_entidade_entidade_id_ocorrido_em_idx" ON "auditoria"("tenant_id", "entidade", "entidade_id", "ocorrido_em");

-- CreateIndex
CREATE INDEX "auditoria_tenant_id_ator_id_ocorrido_em_idx" ON "auditoria"("tenant_id", "ator_id", "ocorrido_em");

-- CreateIndex
CREATE INDEX "evento_outbox_publicado_em_ocorrido_em_idx" ON "evento_outbox"("publicado_em", "ocorrido_em");

-- CreateIndex
CREATE INDEX "evento_outbox_tenant_id_tipo_ocorrido_em_idx" ON "evento_outbox"("tenant_id", "tipo", "ocorrido_em");

-- CreateIndex
CREATE INDEX "evento_consumo_tenant_id_consumido_em_idx" ON "evento_consumo"("tenant_id", "consumido_em");

-- CreateIndex
CREATE INDEX "arquivo_tenant_id_entidade_entidade_id_idx" ON "arquivo"("tenant_id", "entidade", "entidade_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquivo_tenant_id_chave_key" ON "arquivo"("tenant_id", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "uf_codigo_ibge_key" ON "uf"("codigo_ibge");

-- CreateIndex
CREATE INDEX "municipio_uf_sigla_nome_idx" ON "municipio"("uf_sigla", "nome");

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_municipio_ibge_fkey" FOREIGN KEY ("municipio_ibge") REFERENCES "municipio"("codigo_ibge") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tenant" ADD CONSTRAINT "usuario_tenant_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tenant" ADD CONSTRAINT "usuario_tenant_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil" ADD CONSTRAINT "perfil_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tenant_perfil" ADD CONSTRAINT "usuario_tenant_perfil_usuario_tenant_id_fkey" FOREIGN KEY ("usuario_tenant_id") REFERENCES "usuario_tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tenant_perfil" ADD CONSTRAINT "usuario_tenant_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_uf_sigla_fkey" FOREIGN KEY ("uf_sigla") REFERENCES "uf"("sigla") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================================
-- Row Level Security (ADR-0003)
-- Toda tabela com tenant_id recebe policy de isolamento na mesma migration.
-- FORCE é obrigatorio: sem ele o dono da tabela ignora a policy.
-- O contexto vem de set_config('app.tenant_id', <uuid>, true), local a transacao.
--
-- O nullif() nao e detalhe: sem contexto, current_setting devolve string vazia,
-- e ''::uuid levanta erro de sintaxe em vez de simplesmente nao retornar nada.
-- Com nullif a comparacao vira NULL e a consulta devolve zero linhas, que e o
-- comportamento correto para uma query que escapou do helper de tenant.
--
-- Verificado no CI por scripts/check-rls.ts e pelo teste de isolamento.
-- ============================================================================

DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'usuario_tenant', 'perfil', 'perfil_permissao', 'usuario_tenant_perfil',
    'usuario_permissao', 'auditoria', 'evento_outbox', 'evento_consumo',
    'parametro', 'arquivo'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)
         WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
  END LOOP;
END $$;

-- ============================================================================
-- Excecao de bootstrap: autenticacao
--
-- usuario_tenant e o diretorio que liga pessoa a empresa. No login ainda nao
-- sabemos o tenant -- e exatamente essa linha que diz qual e. Com apenas a
-- policy de isolamento, o login jamais encontraria o vinculo: impasse.
--
-- Esta policy adicional libera SOMENTE select e SOMENTE quando o codigo de
-- autenticacao declara o contexto. Policies permissivas sao combinadas com OR,
-- entao o acesso normal continua isolado por tenant.
--
-- O flag e definido em um unico lugar (src/shared/auth/auth.ts) e e local a
-- transacao. Qualquer outro uso e defeito -- ha teste de integracao cobrindo.
-- ============================================================================

CREATE POLICY autenticacao_vinculo ON usuario_tenant
  FOR SELECT
  USING (current_setting('app.autenticando', true) = 'on');

-- ============================================================================
-- Auditoria imutavel: a aplicacao registra, mas nunca altera nem apaga.
-- ============================================================================

CREATE OR REPLACE FUNCTION auditoria_somente_insercao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'auditoria e imutavel: % nao permitido', TG_OP;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER auditoria_bloqueia_alteracao
  BEFORE UPDATE OR DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION auditoria_somente_insercao();
