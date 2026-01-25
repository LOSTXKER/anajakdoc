"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

/**
 * White-label / Branding Types (Section 22)
 */

export type FirmBranding = {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  customDomain: string | null;
};

export type FirmSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  branding: FirmBranding;
};

/**
 * Get firm settings including branding
 */
export async function getFirmSettings(): Promise<ApiResponse<FirmSettings>> {
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
    return { success: false, error: "คุณไม่ได้เป็นสมาชิกของสำนักงานบัญชี" };
  }

  const firm = firmMember.firm;
  const settings = firm.settings as Record<string, unknown> || {};

  return {
    success: true,
    data: {
      id: firm.id,
      name: firm.name,
      slug: firm.slug,
      description: firm.description,
      taxId: firm.taxId,
      address: firm.address,
      phone: firm.phone,
      email: firm.email,
      branding: {
        logo: firm.logo,
        primaryColor: (settings.primaryColor as string) || "#7c3aed",
        secondaryColor: (settings.secondaryColor as string) || "#8b5cf6",
        footerText: (settings.footerText as string) || "",
        customDomain: (settings.customDomain as string) || null,
      },
    },
  };
}

/**
 * Update firm info
 */
export async function updateFirmInfo(data: {
  name?: string;
  description?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
}): Promise<ApiResponse<void | undefined>> {
  const user = await requireUser();

  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
      isActive: true,
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขข้อมูล" };
  }

  await prisma.accountingFirm.update({
    where: { id: firmMember.firmId },
    data: {
      name: data.name,
      description: data.description,
      taxId: data.taxId,
      address: data.address,
      phone: data.phone,
      email: data.email,
    },
  });

  revalidatePath("/firm/settings");
  return { success: true, data: undefined };
}

/**
 * Update firm branding
 */
export async function updateFirmBranding(data: {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
  customDomain?: string;
}): Promise<ApiResponse<void | undefined>> {
  const user = await requireUser();

  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
      isActive: true,
    },
    include: {
      firm: true,
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขข้อมูล" };
  }

  const currentSettings = (firmMember.firm.settings as Record<string, unknown>) || {};

  const newSettings = {
    ...currentSettings,
    primaryColor: data.primaryColor ?? currentSettings.primaryColor ?? "#7c3aed",
    secondaryColor: data.secondaryColor ?? currentSettings.secondaryColor ?? "#8b5cf6",
    footerText: data.footerText ?? currentSettings.footerText ?? "",
    customDomain: data.customDomain ?? currentSettings.customDomain ?? null,
  };

  await prisma.accountingFirm.update({
    where: { id: firmMember.firmId },
    data: {
      logo: data.logo !== undefined ? data.logo : firmMember.firm.logo,
      settings: JSON.parse(JSON.stringify(newSettings)),
    },
  });

  revalidatePath("/firm/settings");
  return { success: true, data: undefined };
}
