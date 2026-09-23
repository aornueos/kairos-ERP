-- CreateEnum
CREATE TYPE "SituacaoRomaneio" AS ENUM ('ABERTO', 'CANCELADO');

-- CreateTable
CREATE TABLE "linha_produto" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "apelo" VARCHAR(80),
    "cor" VARCHAR(7) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "linha_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "linha_id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "ean" VARCHAR(13),
    "dun14" VARCHAR(14),
    "ncm" VARCHAR(8) NOT NULL,
    "cest" VARCHAR(7),
    "cst_csosn" VARCHAR(3) NOT NULL,
    "comprimento_cm" DECIMAL(7,2),
    "largura_cm" DECIMAL(7,2),
    "altura_cm" DECIMAL(7,2),
    "preco" DECIMAL(12,2) NOT NULL,
    "caixa_master" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "romaneio" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "situacao" "SituacaoRomaneio" NOT NULL DEFAULT 'ABERTO',
    "cliente_razao_social" VARCHAR(120) NOT NULL,
    "cliente_documento" VARCHAR(14),
    "cliente_telefone" VARCHAR(20),
    "cliente_email" VARCHAR(120),
    "cliente_endereco" VARCHAR(250),
    "condicoes_pagamento" VARCHAR(250),
    "desconto_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "observacoes" VARCHAR(1000),
    "vendedor_id" UUID NOT NULL,
    "vendedor_nome" VARCHAR(120) NOT NULL,
    "cancelado_em" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "romaneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "romaneio_item" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "romaneio_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "ordem" INTEGER NOT NULL,
    "linha_nome" VARCHAR(60) NOT NULL,
    "linha_apelo" VARCHAR(80),
    "linha_cor" VARCHAR(7) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "ean" VARCHAR(13),
    "dun14" VARCHAR(14),
    "ncm" VARCHAR(8) NOT NULL,
    "cest" VARCHAR(7),
    "cst_csosn" VARCHAR(3) NOT NULL,
    "comprimento_cm" DECIMAL(7,2),
    "largura_cm" DECIMAL(7,2),
    "altura_cm" DECIMAL(7,2),
    "preco" DECIMAL(12,2) NOT NULL,
    "caixa_master" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "romaneio_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "linha_produto_tenant_id_ativo_ordem_idx" ON "linha_produto"("tenant_id", "ativo", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "linha_produto_tenant_id_nome_key" ON "linha_produto"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "produto_tenant_id_linha_id_ativo_idx" ON "produto"("tenant_id", "linha_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "produto_tenant_id_codigo_key" ON "produto"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "produto_tenant_id_ean_key" ON "produto"("tenant_id", "ean");

-- CreateIndex
CREATE INDEX "romaneio_tenant_id_situacao_criado_em_idx" ON "romaneio"("tenant_id", "situacao", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "romaneio_tenant_id_numero_key" ON "romaneio"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "romaneio_item_tenant_id_romaneio_id_idx" ON "romaneio_item"("tenant_id", "romaneio_id");

-- CreateIndex
CREATE INDEX "romaneio_item_tenant_id_produto_id_idx" ON "romaneio_item"("tenant_id", "produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "romaneio_item_romaneio_id_produto_id_key" ON "romaneio_item"("romaneio_id", "produto_id");

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_linha_id_fkey" FOREIGN KEY ("linha_id") REFERENCES "linha_produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_ncm_fkey" FOREIGN KEY ("ncm") REFERENCES "ncm"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "romaneio_item" ADD CONSTRAINT "romaneio_item_romaneio_id_fkey" FOREIGN KEY ("romaneio_id") REFERENCES "romaneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "romaneio_item" ADD CONSTRAINT "romaneio_item_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------- invariantes
-- Última linha de defesa: a aplicação valida antes, mas dado torto que entre
-- por script ou importação para aqui.

ALTER TABLE "linha_produto"
  ADD CONSTRAINT "linha_produto_cor_hex" CHECK (cor ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE "produto"
  ADD CONSTRAINT "produto_preco_nao_negativo" CHECK (preco >= 0),
  ADD CONSTRAINT "produto_caixa_master_positiva" CHECK (caixa_master > 0),
  ADD CONSTRAINT "produto_ean_gtin13" CHECK (ean IS NULL OR ean ~ '^[0-9]{13}$'),
  ADD CONSTRAINT "produto_dun14_gtin14" CHECK (dun14 IS NULL OR dun14 ~ '^[0-9]{14}$'),
  ADD CONSTRAINT "produto_cest_7_digitos" CHECK (cest IS NULL OR cest ~ '^[0-9]{7}$'),
  ADD CONSTRAINT "produto_cst_csosn_3_digitos" CHECK (cst_csosn ~ '^[0-9]{3}$');

ALTER TABLE "romaneio"
  ADD CONSTRAINT "romaneio_numero_positivo" CHECK (numero > 0),
  ADD CONSTRAINT "romaneio_desconto_faixa" CHECK (desconto_percentual >= 0 AND desconto_percentual < 100),
  ADD CONSTRAINT "romaneio_cancelamento_coerente"
    CHECK ((situacao = 'CANCELADO') = (cancelado_em IS NOT NULL));

ALTER TABLE "romaneio_item"
  ADD CONSTRAINT "romaneio_item_quantidade_nao_negativa" CHECK (quantidade >= 0),
  ADD CONSTRAINT "romaneio_item_preco_nao_negativo" CHECK (preco >= 0),
  ADD CONSTRAINT "romaneio_item_caixa_master_positiva" CHECK (caixa_master > 0);

-- ---------------------------------------------------------------- isolamento por tenant
-- Mesmo padrão da migration inicial (ADR-0003): RLS forçada e política única.

DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY['linha_produto', 'produto', 'romaneio', 'romaneio_item'];
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
