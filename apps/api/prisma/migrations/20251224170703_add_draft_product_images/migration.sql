-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "uploadSession" TEXT NOT NULL DEFAULT 'legacy',
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductImage" ("createdAt", "height", "id", "isPrimary", "key", "mime", "productId", "size", "url", "width") SELECT "createdAt", "height", "id", "isPrimary", "key", "mime", "productId", "size", "url", "width" FROM "ProductImage";
DROP TABLE "ProductImage";
ALTER TABLE "new_ProductImage" RENAME TO "ProductImage";
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "ProductImage_productId_isPrimary_idx" ON "ProductImage"("productId", "isPrimary");
CREATE INDEX "ProductImage_uploadSession_idx" ON "ProductImage"("uploadSession");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
