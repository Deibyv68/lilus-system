-- AlterTable
ALTER TABLE "ComprobanteDePago" ADD COLUMN "aceptado" BOOLEAN;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "bancoConfirmado" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "bancoLeido" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "fechaConfirmada" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "montoConfirmado" REAL;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "numeroConfirmado" TEXT;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "revisadoEn" DATETIME;
ALTER TABLE "ComprobanteDePago" ADD COLUMN "revisadoPor" TEXT;

-- CreateIndex
CREATE INDEX "ComprobanteDePago_numeroConfirmado_idx" ON "ComprobanteDePago"("numeroConfirmado");

