"use server";

import prisma from "@/lib/prisma";
import { Prisma } from ".prisma/client";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

export interface SavedFilterData {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
}

export async function getSavedFilters(): Promise<SavedFilterData[]> {
  const session = await requireOrganization();
  
  const filters = await prisma.savedFilter.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      userId: session.id,
    },
    orderBy: [
      { isDefault: "desc" },
      { name: "asc" },
    ],
  });

  return filters.map(f => ({
    id: f.id,
    name: f.name,
    filters: f.filters as Record<string, unknown>,
    isDefault: f.isDefault,
    createdAt: f.createdAt.toISOString(),
  }));
}

export async function createSavedFilter(
  name: string,
  filters: Record<string, unknown>
): Promise<ApiResponse<SavedFilterData>> {
  const session = await requireOrganization();
  
  if (!name.trim()) {
    return { success: false, error: "กรุณากรอกชื่อ filter" };
  }

  const savedFilter = await prisma.savedFilter.create({
    data: {
      organizationId: session.currentOrganization.id,
      userId: session.id,
      name: name.trim(),
      filters: filters as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/documents");
  
  return {
    success: true,
    data: {
      id: savedFilter.id,
      name: savedFilter.name,
      filters: savedFilter.filters as Record<string, unknown>,
      isDefault: savedFilter.isDefault,
      createdAt: savedFilter.createdAt.toISOString(),
    },
  };
}

export async function updateSavedFilter(
  id: string,
  data: { name?: string; filters?: Record<string, unknown>; isDefault?: boolean }
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const existing = await prisma.savedFilter.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
      userId: session.id,
    },
  });

  if (!existing) {
    return { success: false, error: "ไม่พบ filter" };
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.savedFilter.updateMany({
      where: {
        organizationId: session.currentOrganization.id,
        userId: session.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  await prisma.savedFilter.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      filters: data.filters as Prisma.InputJsonValue | undefined,
      isDefault: data.isDefault,
    },
  });

  revalidatePath("/documents");
  
  return { success: true };
}

export async function deleteSavedFilter(id: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const existing = await prisma.savedFilter.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
      userId: session.id,
    },
  });

  if (!existing) {
    return { success: false, error: "ไม่พบ filter" };
  }

  await prisma.savedFilter.delete({ where: { id } });

  revalidatePath("/documents");
  
  return { success: true };
}
