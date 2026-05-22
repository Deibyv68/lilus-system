-- AlterTable
ALTER TABLE "Carrier" ADD COLUMN "trackingUrlTemplate" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
