-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "tagline" TEXT,
ADD COLUMN "bannerImageUrl" TEXT,
ADD COLUMN "photoGallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "motto" TEXT,
ADD COLUMN "aboutUs" TEXT,
ADD COLUMN "joinUsInfo" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "socialLinks" JSONB,
ADD COLUMN "colorScheme" TEXT DEFAULT 'blue';

-- CreateTable
CREATE TABLE "org_followers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_followers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_followers_userId_orgId_key" ON "org_followers"("userId", "orgId");

-- AddForeignKey
ALTER TABLE "org_followers" ADD CONSTRAINT "org_followers_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
