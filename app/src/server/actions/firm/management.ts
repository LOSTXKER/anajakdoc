"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

/**
 * Add a client organization to the firm
 */
export async function addClientToFirm(organizationId: string): Promise<ApiResponse<void | undefined>> {
  const user = await requireUser();

  // Verify user is firm owner/admin
  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
      isActive: true,
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่มีสิทธิ์เพิ่มลูกค้า" };
  }

  // Check organization exists and is not already linked
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    return { success: false, error: "ไม่พบองค์กร" };
  }

  if (org.firmId) {
    return { success: false, error: "องค์กรนี้ถูกจัดการโดยสำนักงานบัญชีอื่นแล้ว" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { firmId: firmMember.firmId },
  });

  revalidatePath("/firm");
  return { success: true, data: undefined };
}

/**
 * Remove a client from the firm
 */
export async function removeClientFromFirm(organizationId: string): Promise<ApiResponse<void | undefined>> {
  const user = await requireUser();

  // Verify user is firm owner/admin
  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
      isActive: true,
    },
    include: {
      firm: {
        include: {
          clients: { where: { id: organizationId } },
        },
      },
    },
  });

  if (!firmMember || firmMember.firm.clients.length === 0) {
    return { success: false, error: "คุณไม่มีสิทธิ์ลบลูกค้านี้" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { firmId: null },
  });

  revalidatePath("/firm");
  return { success: true, data: undefined };
}

/**
 * Check if user is a firm member
 */
export async function getUserFirmMembership(): Promise<ApiResponse<{
  firmId: string;
  firmName: string;
  firmSlug: string;
  role: string;
} | null>> {
  const user = await requireUser();

  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      firm: true,
    },
  });

  if (!firmMember) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      firmId: firmMember.firmId,
      firmName: firmMember.firm.name,
      firmSlug: firmMember.firm.slug,
      role: firmMember.role,
    },
  };
}
