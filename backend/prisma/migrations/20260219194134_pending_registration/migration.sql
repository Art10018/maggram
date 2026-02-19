-- CreateTable
CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingEmailVerificationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingId" TEXT NOT NULL,

    CONSTRAINT "PendingEmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_username_key" ON "PendingRegistration"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");

-- CreateIndex
CREATE INDEX "PendingEmailVerificationCode_pendingId_idx" ON "PendingEmailVerificationCode"("pendingId");

-- CreateIndex
CREATE INDEX "PendingEmailVerificationCode_expiresAt_idx" ON "PendingEmailVerificationCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "PendingEmailVerificationCode" ADD CONSTRAINT "PendingEmailVerificationCode_pendingId_fkey" FOREIGN KEY ("pendingId") REFERENCES "PendingRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
