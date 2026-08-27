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
    "updatedAt" DATETIME NOT NULL,
    "slug" TEXT,
    "tagline" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "destacado" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "isPublic", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "slug", "stock", "tagline", "updatedAt", "weightGrams") SELECT "createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "isPublic", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "slug", "stock", "tagline", "updatedAt", "weightGrams" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

