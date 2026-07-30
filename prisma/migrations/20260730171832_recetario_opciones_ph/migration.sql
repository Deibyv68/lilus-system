-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "phKind" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "phValue" TEXT;

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
    "optionGroup" TEXT,
    "optionLabel" TEXT,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "percentage" REAL,
    "linkedRecipeId" TEXT,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_linkedRecipeId_fkey" FOREIGN KEY ("linkedRecipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecipeIngredient" ("id", "linkedRecipeId", "name", "note", "optional", "quantity", "recipeId", "sortOrder", "variant") SELECT "id", "linkedRecipeId", "name", "note", "optional", "quantity", "recipeId", "sortOrder", "variant" FROM "RecipeIngredient";
DROP TABLE "RecipeIngredient";
ALTER TABLE "new_RecipeIngredient" RENAME TO "RecipeIngredient";
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
