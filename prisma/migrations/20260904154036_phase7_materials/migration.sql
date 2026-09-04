-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('fabric', 'trim', 'lining');

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('metres', 'pieces', 'rolls');

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "color" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" "MaterialUnit" NOT NULL,
    "supplier" TEXT,
    "lowStockAt" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignMaterial" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "DesignMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMaterial" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityNeeded" DECIMAL(12,2) NOT NULL,
    "quantityAllocated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "OrderMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_name_idx" ON "Material"("name");

-- CreateIndex
CREATE INDEX "Material_kind_idx" ON "Material"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "DesignMaterial_designId_materialId_key" ON "DesignMaterial"("designId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMaterial_orderId_materialId_key" ON "OrderMaterial"("orderId", "materialId");

-- AddForeignKey
ALTER TABLE "DesignMaterial" ADD CONSTRAINT "DesignMaterial_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignMaterial" ADD CONSTRAINT "DesignMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMaterial" ADD CONSTRAINT "OrderMaterial_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMaterial" ADD CONSTRAINT "OrderMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
