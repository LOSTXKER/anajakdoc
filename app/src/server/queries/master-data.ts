"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";

export async function getCategories(type?: "EXPENSE" | "INCOME") {
  const session = await requireOrganization();
  
  return prisma.category.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      isActive: true,
      ...(type ? { categoryType: type } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getCostCenters() {
  const session = await requireOrganization();
  
  return prisma.costCenter.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getContacts(role?: "VENDOR" | "CUSTOMER" | "BOTH") {
  const session = await requireOrganization();
  
  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
    isActive: true,
  };

  if (role) {
    where.contactRole = { in: [role, "BOTH"] };
  }

  return prisma.contact.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function getMasterData() {
  const session = await requireOrganization();
  
  const [categories, costCenters, contacts] = await Promise.all([
    prisma.category.findMany({
      where: {
        organizationId: session.currentOrganization.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.costCenter.findMany({
      where: {
        organizationId: session.currentOrganization.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: {
        organizationId: session.currentOrganization.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { categories, costCenters, contacts };
}
