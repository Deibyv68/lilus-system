-- AlterTable
ALTER TABLE "ComprobanteDePago" ADD COLUMN "fechaLeida" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "leidoEn" DATETIME;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "montoLeido" REAL;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "numeroLeido" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "textoLeido" TEXT;

-- CreateIndex
CREATE INDEX "ComprobanteDePago_numeroLeido_idx" ON "ComprobanteDePago"("numeroLeido");

