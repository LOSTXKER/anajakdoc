"use server";

/**
 * Export Profile Actions (Section 11.1)
 * 
 * Features:
 * - Create custom export profiles
 * - Edit column mappings
 * - Manage format settings
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// Available fields for export (defined in component files for "use server" compatibility)

export type ExportColumn = {
  field: string;
  header: string;
  order: number;
  width?: number;
};

export type ExportProfileData = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystem: boolean;
  columns: ExportColumn[];
  dateFormat: string;
  numberFormat: string;
  includeVat: boolean;
  includeWht: boolean;
  createdAt: string;
};

// ============================================
// Default profiles
// ============================================

const DEFAULT_GENERIC_COLUMNS: ExportColumn[] = [
  { field: "boxNumber", header: "เลขที่เอกสาร", order: 1 },
  { field: "boxDate", header: "วันที่", order: 2 },
  { field: "title", header: "รายการ", order: 3 },
  { field: "contactName", header: "คู่ค้า", order: 4 },
  { field: "totalAmount", header: "ยอดรวม", order: 5 },
  { field: "vatAmount", header: "VAT", order: 6 },
  { field: "whtAmount", header: "WHT", order: 7 },
  { field: "categoryName", header: "หมวดหมู่", order: 8 },
  { field: "status", header: "สถานะ", order: 9 },
];

const DEFAULT_PEAK_COLUMNS: ExportColumn[] = [
  { field: "boxDate", header: "วันที่", order: 1 },
  { field: "boxNumber", header: "เลขที่เอกสาร", order: 2 },
  { field: "contactName", header: "ชื่อผู้ขาย", order: 3 },
  { field: "contactTaxId", header: "เลขผู้เสียภาษี", order: 4 },
  { field: "description", header: "รายละเอียด", order: 5 },
  { field: "totalAmount", header: "ยอดรวม (รวม VAT)", order: 6 },
  { field: "vatAmount", header: "ภาษีมูลค่าเพิ่ม", order: 7 },
  { field: "whtAmount", header: "ภาษีหัก ณ ที่จ่าย", order: 8 },
  { field: "categoryCode", header: "รหัสบัญชี", order: 9 },
];

const DEFAULT_FLOWACCOUNT_COLUMNS: ExportColumn[] = [
  { field: "boxNumber", header: "Document No.", order: 1 },
  { field: "boxDate", header: "Date", order: 2 },
  { field: "contactName", header: "Vendor", order: 3 },
  { field: "title", header: "Description", order: 4 },
  { field: "totalAmount", header: "Amount", order: 5 },
  { field: "vatAmount", header: "VAT Amount", order: 6 },
  { field: "categoryCode", header: "Account Code", order: 7 },
  { field: "costCenterCode", header: "Cost Center", order: 8 },
];

// ============================================
// CRUD Operations
// ============================================

/**
 * Get all export profiles for the organization
 */
export async function getExportProfiles(): Promise<ApiResponse<ExportProfileData[]>> {
  const session = await requireOrganization();

  const profiles = await prisma.exportProfile.findMany({
    where: { organizationId: session.currentOrganization.id },
    orderBy: [
      { isDefault: "desc" },
      { isSystem: "desc" },
      { name: "asc" },
    ],
  });

  return {
    success: true,
    data: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isDefault: p.isDefault,
      isSystem: p.isSystem,
      columns: p.columns as ExportColumn[],
      dateFormat: p.dateFormat,
      numberFormat: p.numberFormat,
      includeVat: p.includeVat,
      includeWht: p.includeWht,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

/**
 * Create a new export profile
 */
export async function createExportProfile(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string || null;
  const baseProfile = formData.get("baseProfile") as string || "GENERIC";
  const isDefault = formData.get("isDefault") === "true";

  if (!name) {
    return { success: false, error: "กรุณากรอกชื่อ Profile" };
  }

  // Check for duplicate name
  const existing = await prisma.exportProfile.findFirst({
    where: {
      organizationId: session.currentOrganization.id,
      name,
    },
  });

  if (existing) {
    return { success: false, error: "ชื่อ Profile นี้มีอยู่แล้ว" };
  }

  // Get default columns based on base profile
  let columns: ExportColumn[] = DEFAULT_GENERIC_COLUMNS;
  if (baseProfile === "PEAK") columns = DEFAULT_PEAK_COLUMNS;
  if (baseProfile === "FLOWACCOUNT") columns = DEFAULT_FLOWACCOUNT_COLUMNS;

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.exportProfile.updateMany({
      where: {
        organizationId: session.currentOrganization.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const profile = await prisma.exportProfile.create({
    data: {
      organizationId: session.currentOrganization.id,
      name,
      description,
      isDefault,
      isSystem: false,
      columns,
    },
  });

  revalidatePath("/settings/export-profiles");
  revalidatePath("/export");
  
  return { success: true, data: { id: profile.id } };
}

/**
 * Update an export profile
 */
export async function updateExportProfile(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isDefault?: boolean;
    columns?: ExportColumn[];
    dateFormat?: string;
    numberFormat?: string;
    includeVat?: boolean;
    includeWht?: boolean;
  }
): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const profile = await prisma.exportProfile.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!profile) {
    return { success: false, error: "ไม่พบ Profile" };
  }

  if (profile.isSystem) {
    return { success: false, error: "ไม่สามารถแก้ไข Profile ระบบได้" };
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.exportProfile.updateMany({
      where: {
        organizationId: session.currentOrganization.id,
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  // Check name uniqueness if changing name
  if (data.name && data.name !== profile.name) {
    const existing = await prisma.exportProfile.findFirst({
      where: {
        organizationId: session.currentOrganization.id,
        name: data.name,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: "ชื่อ Profile นี้มีอยู่แล้ว" };
    }
  }

  await prisma.exportProfile.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      columns: data.columns,
      dateFormat: data.dateFormat,
      numberFormat: data.numberFormat,
      includeVat: data.includeVat,
      includeWht: data.includeWht,
    },
  });

  revalidatePath("/settings/export-profiles");
  revalidatePath("/export");

  return { success: true, data: undefined };
}

/**
 * Delete an export profile
 */
export async function deleteExportProfile(id: string): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const profile = await prisma.exportProfile.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!profile) {
    return { success: false, error: "ไม่พบ Profile" };
  }

  if (profile.isSystem) {
    return { success: false, error: "ไม่สามารถลบ Profile ระบบได้" };
  }

  await prisma.exportProfile.delete({ where: { id } });

  revalidatePath("/settings/export-profiles");
  revalidatePath("/export");

  return { success: true, data: undefined };
}

/**
 * Initialize default profiles for an organization
 * Called when organization is created or when user accesses export for the first time
 */
export async function ensureDefaultProfiles(): Promise<void> {
  const session = await requireOrganization();

  // Check if any profiles exist
  const count = await prisma.exportProfile.count({
    where: { organizationId: session.currentOrganization.id },
  });

  if (count > 0) return;

  // Create default system profiles
  await prisma.exportProfile.createMany({
    data: [
      {
        organizationId: session.currentOrganization.id,
        name: "ทั่วไป (Generic)",
        description: "รูปแบบมาตรฐานสำหรับการใช้งานทั่วไป",
        isDefault: true,
        isSystem: true,
        columns: DEFAULT_GENERIC_COLUMNS,
      },
      {
        organizationId: session.currentOrganization.id,
        name: "PEAK Accounting",
        description: "รูปแบบสำหรับ import เข้า PEAK",
        isDefault: false,
        isSystem: true,
        columns: DEFAULT_PEAK_COLUMNS,
      },
      {
        organizationId: session.currentOrganization.id,
        name: "FlowAccount",
        description: "รูปแบบสำหรับ import เข้า FlowAccount",
        isDefault: false,
        isSystem: true,
        columns: DEFAULT_FLOWACCOUNT_COLUMNS,
      },
    ],
  });
}
