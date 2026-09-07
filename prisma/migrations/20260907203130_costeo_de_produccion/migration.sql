-- AlterTable
ALTER TABLE "Material" ADD COLUMN "density" REAL;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "unitsPerBatch" REAL;

-- CreateTable
CREATE TABLE "PackagingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "packId" TEXT,
    "materialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackagingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackagingItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackagingItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "note" TEXT,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "variant" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT,
    "optionGroup" TEXT,
    "optionLabel" TEXT,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "percentage" REAL,
    "linkedRecipeId" TEXT,
    "materialId" TEXT,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_linkedRecipeId_fkey" FOREIGN KEY ("linkedRecipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecipeIngredient" ("id", "isRecommended", "linkedRecipeId", "name", "note", "optionGroup", "optionLabel", "optional", "percentage", "quantity", "recipeId", "role", "sortOrder", "variant") SELECT "id", "isRecommended", "linkedRecipeId", "name", "note", "optionGroup", "optionLabel", "optional", "percentage", "quantity", "recipeId", "role", "sortOrder", "variant" FROM "RecipeIngredient";
DROP TABLE "RecipeIngredient";
ALTER TABLE "new_RecipeIngredient" RENAME TO "RecipeIngredient";
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
CREATE INDEX "RecipeIngredient_materialId_idx" ON "RecipeIngredient"("materialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PackagingItem_productId_idx" ON "PackagingItem"("productId");

-- CreateIndex
CREATE INDEX "PackagingItem_packId_idx" ON "PackagingItem"("packId");

-- CreateIndex
CREATE INDEX "PackagingItem_materialId_idx" ON "PackagingItem"("materialId");
