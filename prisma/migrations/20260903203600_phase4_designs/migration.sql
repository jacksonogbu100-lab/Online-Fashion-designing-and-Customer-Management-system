-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('concept', 'in_development', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "DesignCategory" AS ENUM ('jeans', 'trousers', 'shirts', 'jackets', 'other');

-- CreateEnum
CREATE TYPE "DesignImageKind" AS ENUM ('sketch', 'drape', 'mood');

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "status" "CollectionStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DesignCategory" NOT NULL,
    "status" "DesignStatus" NOT NULL DEFAULT 'concept',
    "colorNotes" TEXT,
    "fabricNotes" TEXT,
    "constructionNotes" TEXT,
    "sharedWithClient" BOOLEAN NOT NULL DEFAULT false,
    "collectionId" TEXT,
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignImage" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" "DesignImageKind" NOT NULL DEFAULT 'sketch',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Collection_status_idx" ON "Collection"("status");

-- CreateIndex
CREATE INDEX "Design_title_idx" ON "Design"("title");

-- CreateIndex
CREATE INDEX "Design_status_idx" ON "Design"("status");

-- CreateIndex
CREATE INDEX "Design_collectionId_idx" ON "Design"("collectionId");

-- CreateIndex
CREATE INDEX "Design_clientId_idx" ON "Design"("clientId");

-- CreateIndex
CREATE INDEX "DesignImage_designId_sortOrder_idx" ON "DesignImage"("designId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignImage" ADD CONSTRAINT "DesignImage_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
