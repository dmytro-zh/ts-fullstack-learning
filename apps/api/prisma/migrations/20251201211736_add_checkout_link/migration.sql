-- CreateTable
CREATE TABLE "CheckoutLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckoutLink_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutLink_slug_key" ON "CheckoutLink"("slug");

-- CreateIndex
CREATE INDEX "CheckoutLink_productId_idx" ON "CheckoutLink"("productId");

-- CreateIndex
CREATE INDEX "CheckoutLink_storeId_idx" ON "CheckoutLink"("storeId");
