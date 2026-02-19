/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `AttachmentDownload` table. All the data in the column will be lost.
  - You are about to drop the column `downloadedAt` on the `AttachmentDownload` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAfter` on the `MessageAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `firstDownloadedAt` on the `MessageAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifiedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `PendingEmailVerificationCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PendingRegistration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PendingSignup` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `PendingUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `PendingUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `AttachmentDownload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PendingUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AttachmentDownload" DROP CONSTRAINT "AttachmentDownload_attachmentId_fkey";

-- DropForeignKey
ALTER TABLE "PendingEmailVerificationCode" DROP CONSTRAINT "PendingEmailVerificationCode_pendingId_fkey";

-- DropIndex
DROP INDEX "AttachmentDownload_attachmentId_userId_key";

-- DropIndex
DROP INDEX "MessageAttachment_deleteAfter_idx";

-- AlterTable
ALTER TABLE "AttachmentDownload" DROP COLUMN "attachmentId",
DROP COLUMN "downloadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MessageAttachment" DROP COLUMN "deleteAfter",
DROP COLUMN "firstDownloadedAt";

-- AlterTable
ALTER TABLE "PendingUser" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerifiedAt";

-- DropTable
DROP TABLE "PendingEmailVerificationCode";

-- DropTable
DROP TABLE "PendingRegistration";

-- DropTable
DROP TABLE "PendingSignup";

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_username_key" ON "PendingUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_email_key" ON "PendingUser"("email");
