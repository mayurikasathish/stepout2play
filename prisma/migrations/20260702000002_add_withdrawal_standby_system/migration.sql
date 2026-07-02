-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'STANDBY';
ALTER TYPE "RegistrationStatus" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "replacementWindowHours" INTEGER DEFAULT 24;

-- AlterTable
ALTER TABLE "registrations"
ADD COLUMN "registrationOrder" INTEGER,
ADD COLUMN "isStandby" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "standbyPosition" INTEGER,
ADD COLUMN "withdrawalReason" TEXT;
