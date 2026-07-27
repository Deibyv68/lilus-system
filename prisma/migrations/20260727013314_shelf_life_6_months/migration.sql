-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortName" TEXT,
    "imageUrl" TEXT,
    "labelPdfUrl" TEXT,
    "price" REAL NOT NULL,
    "packPrice" REAL,
    "productionCost" REAL NOT NULL DEFAULT 0,
    "weightGrams" REAL,
    "ingredients" TEXT,
    "shelfLifeMonths" INTEGER DEFAULT 6,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "stock", "updatedAt", "weightGrams") SELECT "createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "stock", "updatedAt", "weightGrams" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Todos los productos pasan a 6 meses de vida útil, no solo los nuevos.
-- Esto NO altera los pedidos ya creados: cada ProductionUnit guarda su
-- expiryDate calculada en el momento, así que las etiquetas ya impresas
-- siguen coincidiendo con lo que dice el sistema.
UPDATE "Product" SET "shelfLifeMonths" = 6;
