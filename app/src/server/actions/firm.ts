"use server";

/**
 * Accounting Firm Actions (Section 22 - Multi-tenant & Accounting Firm Mode)
 * 
 * Features:
 * - Multi-company overview
 * - SLA/KPI per client
 * - WHT outstanding per client
 * - Client health score
 */

import prisma from "@/lib/prisma";
import { requireUser, requireAuth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// ============================================
// FIRM CREATION (Onboarding)
// ============================================

function generateFirmSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  
  if (!slug || slug.length < 2) {
    return `firm-${Date.now().toString(36)}`;
  }
  
  return slug;
}

async function generateUniqueFirmSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.accountingFirm.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

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
    console.error("Error creating accounting firm:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างสำนักงานบัญชี" };
  }
}

// ============================================
// FIRM DASHBOARD DATA
// ============================================

export type ClientOverview = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  // Stats
  pendingBoxes: number;
  pendingAmount: number;
  whtOutstanding: number;
  whtOverdueCount: number;
  needMoreDocsCount: number;
  readyToBookCount: number;
  overdueTasksCount: number;
  // KPIs
  avgAgingDays: number;
  completionRate: number; // % of boxes that are BOOKED/ARCHIVED
  // Health score (0-100)
  healthScore: number;
};

export type FirmDashboardStats = {
  firmName: string;
  totalClients: number;
  totalPendingBoxes: number;
  totalPendingAmount: number;
  totalWhtOutstanding: number;
  totalWhtOverdue: number;
  clients: ClientOverview[];
};

/**
 * Get firm dashboard data for multi-client overview
 */
export async function getFirmDashboard(): Promise<ApiResponse<FirmDashboardStats>> {
  const user = await requireUser();

  // Find firm membership
  const firmMember = await prisma.firmMember.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      firm: {
        include: {
          clients: true,
        },
      },
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่ได้เป็นสมาชิกของสำนักงานบัญชี" };
  }

  const firm = firmMember.firm;
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get stats for each client
  const clientsWithStats = await Promise.all(
    firm.clients.map(async (client) => {
      const [
        pendingBoxes,
        pendingAmount,
        whtOutstanding,
        whtOverdueCount,
        needMoreDocsCount,
        readyToBookCount,
        overdueTasksCount,
        totalBoxes,
        completedBoxes,
        // Aging data
        aging0to3,
        aging4to7,
        aging8to14,
        aging15plus,
      ] = await Promise.all([
        // Pending boxes (not COMPLETED)
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
          },
        }),
        // Pending amount
        prisma.box.aggregate({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
          },
          _sum: { totalAmount: true },
        }),
        // WHT outstanding
        prisma.box.aggregate({
          where: {
            organizationId: client.id,
            hasWht: true,
            whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] },
          },
          _sum: { whtAmount: true },
        }),
        // WHT overdue
        prisma.box.count({
          where: {
            organizationId: client.id,
            hasWht: true,
            whtOverdue: true,
          },
        }),
        // Need docs (using new status)
        prisma.box.count({
          where: { organizationId: client.id, status: "NEED_DOCS" },
        }),
        // Ready to book (PENDING in new system)
        prisma.box.count({
          where: { organizationId: client.id, status: "PENDING" },
        }),
        // Overdue tasks
        prisma.task.count({
          where: {
            organizationId: client.id,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            dueDate: { lt: now },
          },
        }),
        // Total boxes (all non-draft)
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["DRAFT"] },
          },
        }),
        // Completed boxes
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: "COMPLETED",
          },
        }),
        // Aging buckets (not completed)
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
            createdAt: { gte: threeDaysAgo },
          },
        }),
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
            createdAt: { lt: threeDaysAgo, gte: sevenDaysAgo },
          },
        }),
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
            createdAt: { lt: sevenDaysAgo, gte: fourteenDaysAgo },
          },
        }),
        prisma.box.count({
          where: {
            organizationId: client.id,
            status: { notIn: ["COMPLETED"] },
            createdAt: { lt: fourteenDaysAgo },
          },
        }),
      ]);

      // Calculate average aging days (weighted average)
      const totalAging = 
        aging0to3 * 1.5 + 
        aging4to7 * 5.5 + 
        aging8to14 * 11 + 
        aging15plus * 21;
      const avgAgingDays = pendingBoxes > 0 ? totalAging / pendingBoxes : 0;

      // Calculate completion rate
      const completionRate = totalBoxes > 0 
        ? Math.round((completedBoxes / totalBoxes) * 100) 
        : 100;

      // Calculate health score (0-100)
      // Factors: completion rate, overdue WHT, need more docs, overdue tasks
      let healthScore = 100;
      healthScore -= Math.min(30, whtOverdueCount * 10); // -10 per overdue WHT, max -30
      healthScore -= Math.min(20, needMoreDocsCount * 5); // -5 per need more docs, max -20
      healthScore -= Math.min(20, overdueTasksCount * 5); // -5 per overdue task, max -20
      healthScore -= Math.max(0, 30 - completionRate) * 0.5; // Penalty for low completion
      healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

      return {
        id: client.id,
        name: client.name,
        slug: client.slug,
        logo: client.logo,
        pendingBoxes,
        pendingAmount: pendingAmount._sum.totalAmount?.toNumber() || 0,
        whtOutstanding: whtOutstanding._sum.whtAmount?.toNumber() || 0,
        whtOverdueCount,
        needMoreDocsCount,
        readyToBookCount,
        overdueTasksCount,
        avgAgingDays: Math.round(avgAgingDays * 10) / 10,
        completionRate,
        healthScore,
      } satisfies ClientOverview;
    })
  );

  // Calculate totals
  const totals = clientsWithStats.reduce(
    (acc, client) => ({
      totalPendingBoxes: acc.totalPendingBoxes + client.pendingBoxes,
      totalPendingAmount: acc.totalPendingAmount + client.pendingAmount,
      totalWhtOutstanding: acc.totalWhtOutstanding + client.whtOutstanding,
      totalWhtOverdue: acc.totalWhtOverdue + client.whtOverdueCount,
    }),
    {
      totalPendingBoxes: 0,
      totalPendingAmount: 0,
      totalWhtOutstanding: 0,
      totalWhtOverdue: 0,
    }
  );

  // Sort clients by health score (worst first) then by pending boxes
  const sortedClients = clientsWithStats.sort((a, b) => {
    if (a.healthScore !== b.healthScore) return a.healthScore - b.healthScore;
    return b.pendingBoxes - a.pendingBoxes;
  });

  return {
    success: true,
    data: {
      firmName: firm.name,
      totalClients: firm.clients.length,
      ...totals,
      clients: sortedClients,
    },
  };
}

// ============================================
// FIRM MANAGEMENT
// ============================================

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

// ============================================
// WHITE-LABEL / BRANDING (Section 22)
// ============================================

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
