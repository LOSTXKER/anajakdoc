"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; error?: string };

// ============================================
// CATEGORIES
// ============================================

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const session = await requireOrganization();

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const categoryType = formData.get("categoryType") as "EXPENSE" | "INCOME";
  const peakAccountCode = formData.get("peakAccountCode") as string || null;

  if (!code || !name) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  // Check duplicate code
  const existing = await prisma.category.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      code,
    },
  });

  if (existing) {
    return { success: false, error: "รหัสหมวดหมู่นี้มีอยู่แล้ว" };
  }

  await prisma.category.create({
    data: {
      organizationId: session.currentOrganization.id,
      code,
      name,
      categoryType,
      peakAccountCode,
    },
  });

  revalidatePath("/settings/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  const session = await requireOrganization();

  const category = await prisma.category.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!category) {
    return { success: false, error: "ไม่พบหมวดหมู่" };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const categoryType = formData.get("categoryType") as "EXPENSE" | "INCOME";
  const peakAccountCode = formData.get("peakAccountCode") as string || null;

  // Check duplicate code (excluding current)
  const existing = await prisma.category.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      code,
      id: { not: id },
    },
  });

  if (existing) {
    return { success: false, error: "รหัสหมวดหมู่นี้มีอยู่แล้ว" };
  }

  await prisma.category.update({
    where: { id },
    data: {
      code,
      name,
      categoryType,
      peakAccountCode,
    },
  });

  revalidatePath("/settings/categories");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await requireOrganization();

  const category = await prisma.category.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      _count: { select: { documents: true } },
    },
  });

  if (!category) {
    return { success: false, error: "ไม่พบหมวดหมู่" };
  }

  if (category._count.documents > 0) {
    return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีเอกสารใช้งานอยู่" };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/settings/categories");
  return { success: true };
}

// ============================================
// COST CENTERS
// ============================================

export async function createCostCenter(formData: FormData): Promise<ActionResult> {
  const session = await requireOrganization();

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string || null;

  if (!code || !name) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  // Check duplicate code
  const existing = await prisma.costCenter.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      code,
    },
  });

  if (existing) {
    return { success: false, error: "รหัสศูนย์ต้นทุนนี้มีอยู่แล้ว" };
  }

  await prisma.costCenter.create({
    data: {
      organizationId: session.currentOrganization.id,
      code,
      name,
      description,
    },
  });

  revalidatePath("/settings/cost-centers");
  return { success: true };
}

export async function updateCostCenter(id: string, formData: FormData): Promise<ActionResult> {
  const session = await requireOrganization();

  const costCenter = await prisma.costCenter.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!costCenter) {
    return { success: false, error: "ไม่พบศูนย์ต้นทุน" };
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string || null;

  // Check duplicate code (excluding current)
  const existing = await prisma.costCenter.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      code,
      id: { not: id },
    },
  });

  if (existing) {
    return { success: false, error: "รหัสศูนย์ต้นทุนนี้มีอยู่แล้ว" };
  }

  await prisma.costCenter.update({
    where: { id },
    data: { code, name, description },
  });

  revalidatePath("/settings/cost-centers");
  return { success: true };
}

export async function deleteCostCenter(id: string): Promise<ActionResult> {
  const session = await requireOrganization();

  const costCenter = await prisma.costCenter.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      _count: { select: { documents: true } },
    },
  });

  if (!costCenter) {
    return { success: false, error: "ไม่พบศูนย์ต้นทุน" };
  }

  if (costCenter._count.documents > 0) {
    return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีเอกสารใช้งานอยู่" };
  }

  await prisma.costCenter.delete({ where: { id } });

  revalidatePath("/settings/cost-centers");
  return { success: true };
}

// ============================================
// CONTACTS
// ============================================

export async function createContact(formData: FormData): Promise<ActionResult & { data?: { id: string; name: string } }> {
  const session = await requireOrganization();

  const name = formData.get("name") as string;
  const contactType = (formData.get("contactType") as "INDIVIDUAL" | "COMPANY") || "COMPANY";
  const contactRole = (formData.get("contactRole") as "VENDOR" | "CUSTOMER" | "BOTH") || "VENDOR";
  const taxId = formData.get("taxId") as string || null;
  const address = formData.get("address") as string || null;
  const phone = formData.get("phone") as string || null;
  const email = formData.get("email") as string || null;

  if (!name) {
    return { success: false, error: "กรุณากรอกชื่อ" };
  }

  const contact = await prisma.contact.create({
    data: {
      organizationId: session.currentOrganization.id,
      name,
      contactType,
      contactRole,
      taxId,
      address,
      phone,
      email,
    },
  });

  revalidatePath("/settings/contacts");
  revalidatePath("/documents/new");
  return { success: true, data: { id: contact.id, name: contact.name } };
}

// Quick create contact (minimal info)
export async function quickCreateContact(
  name: string,
  role: "VENDOR" | "CUSTOMER" | "BOTH" = "VENDOR"
): Promise<ActionResult & { data?: { id: string; name: string } }> {
  const session = await requireOrganization();

  if (!name || name.trim().length < 2) {
    return { success: false, error: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" };
  }

  const contact = await prisma.contact.create({
    data: {
      organizationId: session.currentOrganization.id,
      name: name.trim(),
      contactType: "COMPANY",
      contactRole: role,
    },
  });

  revalidatePath("/settings/contacts");
  return { success: true, data: { id: contact.id, name: contact.name } };
}

export async function updateContact(id: string, formData: FormData): Promise<ActionResult> {
  const session = await requireOrganization();

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!contact) {
    return { success: false, error: "ไม่พบผู้ติดต่อ" };
  }

  const name = formData.get("name") as string;
  const contactType = formData.get("contactType") as "INDIVIDUAL" | "COMPANY";
  const contactRole = formData.get("contactRole") as "VENDOR" | "CUSTOMER" | "BOTH";
  const taxId = formData.get("taxId") as string || null;
  const address = formData.get("address") as string || null;
  const phone = formData.get("phone") as string || null;
  const email = formData.get("email") as string || null;

  await prisma.contact.update({
    where: { id },
    data: {
      name,
      contactType,
      contactRole,
      taxId,
      address,
      phone,
      email,
    },
  });

  revalidatePath("/settings/contacts");
  return { success: true };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const session = await requireOrganization();

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      _count: { select: { documents: true } },
    },
  });

  if (!contact) {
    return { success: false, error: "ไม่พบผู้ติดต่อ" };
  }

  if (contact._count.documents > 0) {
    return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีเอกสารใช้งานอยู่" };
  }

  await prisma.contact.delete({ where: { id } });

  revalidatePath("/settings/contacts");
  return { success: true };
}
