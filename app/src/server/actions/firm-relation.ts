"use server";

import prisma from "@/lib/prisma";
import { requireOrganization, getSession } from "@/server/auth";
import type { ApiResponse } from "@/types";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface FirmRelationData {
  id: string;
  firmId: string;
  firmName: string;
  firmSlug: string;
  firmLogo: string | null;
  status: "PENDING" | "ACTIVE" | "TERMINATED";
  invitedAt: string;
  respondedAt: string | null;
}

export interface FirmSearchResult {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

// ============================================
// SME ACTIONS - เชิญสำนักบัญชี
// ============================================

/**
 * ค้นหาสำนักบัญชีด้วย slug หรือชื่อ
 */
export async function searchFirms(query: string): Promise<FirmSearchResult[]> {
  if (!query || query.length < 2) return [];

  const firms = await prisma.accountingFirm.findMany({
    where: {
      OR: [
        { slug: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
    take: 10,
  });

  return firms;
}

/**
 * SME เชิญสำนักบัญชีมาดูแล
 */
export async function inviteFirm(firmId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  const organizationId = session.currentOrganization.id;

  // ตรวจสอบว่ามี relation อยู่แล้วหรือไม่
  const existingRelation = await prisma.firmClientRelation.findUnique({
    where: {
      firmId_organizationId: {
        firmId,
        organizationId,
      },
    },
  });

  if (existingRelation) {
    if (existingRelation.status === "ACTIVE") {
      return { success: false, error: "สำนักบัญชีนี้ดูแลธุรกิจของคุณอยู่แล้ว" };
    }
    if (existingRelation.status === "PENDING") {
      return { success: false, error: "คุณส่งคำเชิญไปแล้ว รอการตอบรับ" };
    }
    // If TERMINATED, we can create a new invitation
  }

  // ตรวจสอบว่าสำนักบัญชีมีอยู่จริง
  const firm = await prisma.accountingFirm.findUnique({
    where: { id: firmId },
  });

  if (!firm) {
    return { success: false, error: "ไม่พบสำนักบัญชี" };
  }

  // สร้างหรืออัปเดต relation
  if (existingRelation && existingRelation.status === "TERMINATED") {
    await prisma.firmClientRelation.update({
      where: { id: existingRelation.id },
      data: {
        status: "PENDING",
        invitedByUserId: session.id,
        invitedByType: "BUSINESS",
        invitedAt: new Date(),
        respondedAt: null,
        terminatedAt: null,
        terminatedReason: null,
      },
    });
  } else {
    await prisma.firmClientRelation.create({
      data: {
        firmId,
        organizationId,
        status: "PENDING",
        invitedByUserId: session.id,
        invitedByType: "BUSINESS",
      },
    });
  }

  revalidatePath("/settings/accounting-firm");
  return { success: true };
}

/**
 * SME ยกเลิกคำเชิญที่รอการตอบรับ
 */
export async function cancelFirmInvitation(relationId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const relation = await prisma.firmClientRelation.findFirst({
    where: {
      id: relationId,
      organizationId: session.currentOrganization.id,
      status: "PENDING",
    },
  });

  if (!relation) {
    return { success: false, error: "ไม่พบคำเชิญ" };
  }

  await prisma.firmClientRelation.delete({
    where: { id: relationId },
  });

  revalidatePath("/settings/accounting-firm");
  return { success: true };
}

/**
 * SME ยกเลิกการดูแลของสำนักบัญชี
 */
export async function terminateFirmRelation(
  relationId: string,
  reason?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const relation = await prisma.firmClientRelation.findFirst({
    where: {
      id: relationId,
      organizationId: session.currentOrganization.id,
      status: "ACTIVE",
    },
  });

  if (!relation) {
    return { success: false, error: "ไม่พบความสัมพันธ์" };
  }

  await prisma.firmClientRelation.update({
    where: { id: relationId },
    data: {
      status: "TERMINATED",
      terminatedAt: new Date(),
      terminatedReason: reason || "ยกเลิกโดยธุรกิจ",
    },
  });

  // Also remove firmId from organization if it was set
  await prisma.organization.update({
    where: { id: session.currentOrganization.id },
    data: { firmId: null },
  });

  revalidatePath("/settings/accounting-firm");
  return { success: true };
}

/**
 * ดึงรายการสำนักบัญชีที่เกี่ยวข้องกับธุรกิจ
 */
export async function getOrganizationFirmRelations(): Promise<FirmRelationData[]> {
  const session = await requireOrganization();

  const relations = await prisma.firmClientRelation.findMany({
    where: {
      organizationId: session.currentOrganization.id,
    },
    include: {
      firm: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  return relations.map((r) => ({
    id: r.id,
    firmId: r.firmId,
    firmName: r.firm.name,
    firmSlug: r.firm.slug,
    firmLogo: r.firm.logo,
    status: r.status,
    invitedAt: r.invitedAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() || null,
  }));
}

// ============================================
// FIRM ACTIONS - ตอบรับ/ปฏิเสธคำเชิญ
// ============================================

export interface FirmInvitationData {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationLogo: string | null;
  invitedAt: string;
  invitedByName: string;
}

/**
 * ดึงรายการคำเชิญที่รอการตอบรับสำหรับสำนักบัญชี
 */
export async function getFirmPendingInvitations(): Promise<FirmInvitationData[]> {
  const session = await getSession();
  if (!session?.firmMembership) {
    return [];
  }

  const relations = await prisma.firmClientRelation.findMany({
    where: {
      firmId: session.firmMembership.firmId,
      status: "PENDING",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  return relations.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    organizationName: r.organization.name,
    organizationSlug: r.organization.slug,
    organizationLogo: r.organization.logo,
    invitedAt: r.invitedAt.toISOString(),
    invitedByName: r.invitedBy.name || "ไม่ระบุ",
  }));
}

/**
 * สำนักบัญชีตอบรับคำเชิญ
 */
export async function acceptFirmInvitation(relationId: string): Promise<ApiResponse> {
  const session = await getSession();
  if (!session?.firmMembership) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const relation = await prisma.firmClientRelation.findFirst({
    where: {
      id: relationId,
      firmId: session.firmMembership.firmId,
      status: "PENDING",
    },
  });

  if (!relation) {
    return { success: false, error: "ไม่พบคำเชิญ" };
  }

  // Update relation to ACTIVE
  await prisma.firmClientRelation.update({
    where: { id: relationId },
    data: {
      status: "ACTIVE",
      respondedAt: new Date(),
    },
  });

  // Also update organization's firmId for backward compatibility
  await prisma.organization.update({
    where: { id: relation.organizationId },
    data: { firmId: session.firmMembership.firmId },
  });

  revalidatePath("/firm/invitations");
  revalidatePath("/firm/clients");
  return { success: true };
}

/**
 * สำนักบัญชีปฏิเสธคำเชิญ
 */
export async function rejectFirmInvitation(relationId: string): Promise<ApiResponse> {
  const session = await getSession();
  if (!session?.firmMembership) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const relation = await prisma.firmClientRelation.findFirst({
    where: {
      id: relationId,
      firmId: session.firmMembership.firmId,
      status: "PENDING",
    },
  });

  if (!relation) {
    return { success: false, error: "ไม่พบคำเชิญ" };
  }

  // Delete the relation
  await prisma.firmClientRelation.delete({
    where: { id: relationId },
  });

  revalidatePath("/firm/invitations");
  return { success: true };
}

/**
 * ดึงรายการ clients ที่ active สำหรับสำนักบัญชี
 */
export async function getFirmActiveClients() {
  const session = await getSession();
  if (!session?.firmMembership) {
    return [];
  }

  const relations = await prisma.firmClientRelation.findMany({
    where: {
      firmId: session.firmMembership.firmId,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          plan: true,
          _count: {
            select: {
              boxes: true,
            },
          },
        },
      },
    },
    orderBy: { respondedAt: "desc" },
  });

  return relations.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    organizationName: r.organization.name,
    organizationSlug: r.organization.slug,
    organizationLogo: r.organization.logo,
    organizationPlan: r.organization.plan,
    boxCount: r.organization._count.boxes,
    activeAt: r.respondedAt?.toISOString() || r.invitedAt.toISOString(),
  }));
}
