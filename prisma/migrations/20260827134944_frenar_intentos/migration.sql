-- CreateTable
CREATE TABLE "IntentoDeEntrada" (
    "clave" TEXT NOT NULL PRIMARY KEY,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "ultimoIntento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

