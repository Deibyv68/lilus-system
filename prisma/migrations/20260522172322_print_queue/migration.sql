-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "kind" TEXT NOT NULL,
    "printerName" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "pdfBase64" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickedAt" DATETIME,
    "finishedAt" DATETIME
);
