-- CreateTable
CREATE TABLE "BorradorDePedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL,
    "usadoEn" DATETIME,
    "orderId" TEXT,
    "creadoPor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BorradorDePedido_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BorradorItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "borradorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BorradorItem_borradorId_fkey" FOREIGN KEY ("borradorId") REFERENCES "BorradorDePedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BorradorDePedido_token_key" ON "BorradorDePedido"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BorradorDePedido_orderId_key" ON "BorradorDePedido"("orderId");

-- CreateIndex
CREATE INDEX "BorradorDePedido_expiraEn_idx" ON "BorradorDePedido"("expiraEn");

-- CreateIndex
CREATE INDEX "BorradorItem_borradorId_idx" ON "BorradorItem"("borradorId");

