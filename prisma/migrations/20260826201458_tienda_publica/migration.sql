-- CreateTable
CREATE TABLE "StoreImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "packId" TEXT,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoreImage_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" REAL NOT NULL,
    "productionCost" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "slug" TEXT,
    "tagline" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Pack" ("createdAt", "description", "id", "imageUrl", "isActive", "name", "price", "productionCost", "sku", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "isActive", "name", "price", "productionCost", "sku", "updatedAt" FROM "Pack";
DROP TABLE "Pack";
ALTER TABLE "new_Pack" RENAME TO "Pack";
CREATE UNIQUE INDEX "Pack_sku_key" ON "Pack"("sku");
CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");
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
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "stock", "updatedAt", "weightGrams") SELECT "createdAt", "description", "id", "imageUrl", "ingredients", "isActive", "labelPdfUrl", "name", "packPrice", "price", "productionCost", "shelfLifeMonths", "shortName", "sku", "stock", "updatedAt", "weightGrams" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StoreImage_productId_idx" ON "StoreImage"("productId");

-- CreateIndex
CREATE INDEX "StoreImage_packId_idx" ON "StoreImage"("packId");
