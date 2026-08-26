-- AlterTable
ALTER TABLE "PrintJob" ADD COLUMN "agentName" TEXT;

-- CreateTable
CREATE TABLE "PrintAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "printerStatus" TEXT NOT NULL DEFAULT 'unknown',
    "printerName" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintAgent_name_key" ON "PrintAgent"("name");
