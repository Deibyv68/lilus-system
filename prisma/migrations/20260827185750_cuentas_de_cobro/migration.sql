-- CreateTable
CREATE TABLE "CuentaDeCobro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banco" TEXT NOT NULL,
    "tipo" TEXT,
    "numero" TEXT NOT NULL,
    "titular" TEXT,
    "cedula" TEXT,
    "correo" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CuentaDeCobro_activa_orden_idx" ON "CuentaDeCobro"("activa", "orden");

