import "server-only";

import { notFound } from "next/navigation";

import { requireCreative, requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";

export async function listMaterialsForCreative() {
  await requireCreative();

  return prisma.material.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
}

export async function listMaterialsForSelect() {
  await requireStaff();

  return prisma.material.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true, color: true, quantity: true, unit: true, lowStockAt: true },
  });
}

export async function getMaterialForCreative(id: string) {
  await requireCreative();

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      designLines: { include: { design: { select: { id: true, title: true } } } },
      orderLines: { include: { order: { select: { id: true, reference: true, title: true } } } },
    },
  });

  if (!material) {
    notFound();
  }

  return material;
}

export async function listDesignMaterials(designId: string) {
  await requireStaff();

  return prisma.designMaterial.findMany({
    where: { designId },
    orderBy: { material: { name: "asc" } },
    include: {
      material: {
        select: { id: true, name: true, kind: true, color: true, quantity: true, unit: true, lowStockAt: true },
      },
    },
  });
}

export async function listOrderMaterials(orderId: string) {
  await requireStaff();

  return prisma.orderMaterial.findMany({
    where: { orderId },
    orderBy: { material: { name: "asc" } },
    include: {
      material: {
        select: { id: true, name: true, kind: true, color: true, quantity: true, unit: true, lowStockAt: true },
      },
    },
  });
}
