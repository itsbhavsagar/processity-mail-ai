-- CreateTable
CREATE TABLE "gmail_sync" (
    "email" TEXT NOT NULL,
    "googleSub" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "historyId" TEXT,
    "watchExpiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_sync_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "gmail_sync_googleSub_key" ON "gmail_sync"("googleSub");
