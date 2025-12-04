/*
  Warnings:

  - Made the column `storeId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "shippingNote" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "checkoutLinkId" TEXT,
    "storeId" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingAddress" TEXT,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("checkoutLinkId", "createdAt", "customerName", "email", "id", "productId", "quantity", "shippingNote", "status", "storeId", "total") SELECT "checkoutLinkId", "createdAt", "customerName", "email", "id", "productId", "quantity", "shippingNote", "status", "storeId", "total" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_checkoutLinkId_idx" ON "Order"("checkoutLinkId");
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "storeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "imageUrl", "inStock", "name", "price", "storeId", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "inStock", "name", "price", "storeId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
