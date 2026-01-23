-- CreateTable
CREATE TABLE "MerchantInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    "usedByUserId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantInvite_code_key" ON "MerchantInvite"("code");
