-- AlterTable
ALTER TABLE "produto" ADD COLUMN     "caixa_box" INTEGER;

-- AlterTable
ALTER TABLE "romaneio_item" ADD COLUMN     "caixa_box" INTEGER,
ADD COLUMN     "preco_manual" DECIMAL(12,2);


-- Box cabe na caixa master; a divisibilidade exata é regra da aplicação, que
-- pode ser relaxada sem migration se surgir embalagem fora do padrão.
ALTER TABLE "produto"
  ADD CONSTRAINT "produto_caixa_box_valida"
    CHECK (caixa_box IS NULL OR (caixa_box > 0 AND caixa_box <= caixa_master));

ALTER TABLE "romaneio_item"
  ADD CONSTRAINT "romaneio_item_caixa_box_valida"
    CHECK (caixa_box IS NULL OR (caixa_box > 0 AND caixa_box <= caixa_master)),
  ADD CONSTRAINT "romaneio_item_preco_manual_positivo"
    CHECK (preco_manual IS NULL OR preco_manual > 0);
