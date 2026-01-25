"use server";

import prisma from "@/lib/prisma";
import { requireUser, requireAuth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { generateFirmSlug, generateUniqueFirmSlug } from "./utils";

/**
 * Create accounting firm from onboarding form
 * Returns { error, success } for useActionState compatibility
 */
export async function createAccountingFirm(
  _prevState: { error: string | null; success: boolean }, 
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const session = await requireAuth();
  
  const name = formData.get("name") as string;
  const taxId = formData.get("taxId") as string || null;
  const address = formData.get("address") as string || null;
  const phone = formData.get("phone") as string || null;
  const email = formData.get("email") as string || null;

  if (!name || name.trim().length < 2) {
    return { success: false, error: "กรุณากรอกชื่อสำนักงานบัญชี" };
  }

  try {
    const baseSlug = generateFirmSlug(name);
    const slug = await generateUniqueFirmSlug(baseSlug);

    await prisma.accountingFirm.create({
      data: {
        name: name.trim(),
        slug,
        taxId,
        address,
        phone,
        email,
        members: {
          create: {
            userId: session.id,
            role: "OWNER",
          },
        },
      },
    });

    return { success: true, error: null };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating accounting firm:", error);
    }
    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างสำนักงานบัญชี" };
  }
}

export type CreateFirmInput = {
  name: string;
  slug: string;
  description?: string;
  taxId?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
};

/**
 * Create a new accounting firm
 */
export async function createFirm(input: FormData | CreateFirmInput): Promise<ApiResponse<{ id: string; slug: string }>> {
  const user = await requireUser();

  // Parse input (support both FormData and object)
  let name: string;
  let slug: string;
  let description: string | null = null;
  let taxId: string | null = null;
  let address: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;

  if (input instanceof FormData) {
    name = input.get("name") as string;
    slug = input.get("slug") as string;
    taxId = input.get("taxId") as string || null;
    address = input.get("address") as string || null;
    phone = input.get("phone") as string || null;
    email = input.get("email") as string || null;
  } else {
    name = input.name;
    slug = input.slug;
    description = input.description || null;
    taxId = input.taxId || null;
    address = input.address || null;
    phone = input.contactPhone || null;
    email = input.contactEmail || null;
  }

  if (!name || !slug) {
    return { success: false, error: "กรุณากรอกชื่อและ slug" };
  }

  // Check slug uniqueness
  const existing = await prisma.accountingFirm.findUnique({
    where: { slug },
  });

  if (existing) {
    return { success: false, error: "slug นี้ถูกใช้แล้ว" };
  }

  const firm = await prisma.accountingFirm.create({
    data: {
      name,
      slug,
      description,
      taxId,
      address,
      phone,
      email,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/firm");
  return { success: true, data: { id: firm.id, slug: firm.slug } };
}
