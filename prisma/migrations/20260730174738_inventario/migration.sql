-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "inciName" TEXT,
    "tradeName" TEXT,
    "manufacturer" TEXT,
    "purpose" TEXT,
    "usageMin" REAL,
    "usageMax" REAL,
    "phMin" REAL,
    "phMax" REAL,
    "maxTemp" REAL,
    "solubility" TEXT,
    "leaveOn" BOOLEAN,
    "spectrum" TEXT,
    "incompatible" TEXT,
    "datasheetUrl" TEXT,
    "container" TEXT,
    "storage" TEXT,
    "lightSensitive" BOOLEAN NOT NULL DEFAULT false,
    "oxygenSensitive" BOOLEAN NOT NULL DEFAULT false,
    "moistureSensitive" BOOLEAN NOT NULL DEFAULT false,
    "openedShelfLife" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaterialLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "supplier" TEXT,
    "purchasedAt" DATETIME,
    "openedAt" DATETIME,
    "expiresAt" DATETIME,
    "lotCode" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "price" REAL,
    "container" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sin-abrir',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialLot_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" DATETIME
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "materialId" TEXT,
    "freeText" TEXT,
    "quantity" TEXT,
    "note" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ShoppingItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");

-- CreateIndex
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- CreateIndex
CREATE INDEX "MaterialLot_materialId_idx" ON "MaterialLot"("materialId");

-- CreateIndex
CREATE INDEX "ShoppingItem_listId_idx" ON "ShoppingItem"("listId");
