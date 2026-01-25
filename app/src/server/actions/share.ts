"use server";

/**
 * External Share Actions (Section 15 - Auditor Mode)
 * 
 * Features:
 * - Create share links with expiration
 * - Password protection (optional)
 * - View count limiting
 * - Control what data is visible
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { ShareScope } from "@prisma/client";
import type { ApiResponse } from "@/types";

// ============================================
// SHARE LINK CRUD
// ============================================

export type ShareLinkData = {
  id: string;
  token: string;
  name: string | null;
  scope: ShareScope;
  boxId: string | null;
  boxIds: string[];
  expiresAt: string | null;
  maxViews: number | null;
  viewCount: number;
  showAmounts: boolean;
  showContacts: boolean;
  allowDownload: boolean;
  createdAt: string;
  lastAccessedAt: string | null;
  // Computed
  shareUrl: string;
  isExpired: boolean;
  isMaxedOut: boolean;
};

/**
 * Get all share links for the organization
 */
export async function getShareLinks(): Promise<ApiResponse<ShareLinkData[]>> {
  const session = await requireOrganization();

  const links = await prisma.shareLink.findMany({
    where: { organizationId: session.currentOrganization.id },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    success: true,
    data: links.map((link) => ({
      id: link.id,
      token: link.token,
      name: link.name,
      scope: link.scope,
      boxId: link.boxId,
      boxIds: link.boxIds,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      maxViews: link.maxViews,
      viewCount: link.viewCount,
      showAmounts: link.showAmounts,
      showContacts: link.showContacts,
      allowDownload: link.allowDownload,
      createdAt: link.createdAt.toISOString(),
      lastAccessedAt: link.lastAccessedAt?.toISOString() ?? null,
      shareUrl: `${baseUrl}/share/${link.token}`,
      isExpired: link.expiresAt ? link.expiresAt < new Date() : false,
      isMaxedOut: link.maxViews ? link.viewCount >= link.maxViews : false,
    })),
  };
}

/**
 * Create a new share link
 */
export async function createShareLink(data: {
  name?: string;
  scope: ShareScope;
  boxId?: string;
  boxIds?: string[];
  periodMonth?: number;
  periodYear?: number;
  password?: string;
  expiresIn?: number; // hours, null = no expiration
  maxViews?: number;
  showAmounts?: boolean;
  showContacts?: boolean;
  allowDownload?: boolean;
}): Promise<ApiResponse<{ id: string; token: string; shareUrl: string }>> {
  const session = await requireOrganization();

  // Generate unique token
  const token = crypto.randomBytes(16).toString("hex");

  // Calculate expiration
  let expiresAt: Date | null = null;
  if (data.expiresIn) {
    expiresAt = new Date(Date.now() + data.expiresIn * 60 * 60 * 1000);
  }

  // Validate scope
  if (data.scope === "BOX" && !data.boxId) {
    return { success: false, error: "กรุณาเลือกกล่องที่ต้องการแชร์" };
  }
  if (data.scope === "MULTIPLE" && (!data.boxIds || data.boxIds.length === 0)) {
    return { success: false, error: "กรุณาเลือกกล่องที่ต้องการแชร์" };
  }
  if (data.scope === "PERIOD" && (!data.periodMonth || !data.periodYear)) {
    return { success: false, error: "กรุณาระบุงวดบัญชี" };
  }

  const link = await prisma.shareLink.create({
    data: {
      organizationId: session.currentOrganization.id,
      token,
      name: data.name,
      scope: data.scope,
      boxId: data.scope === "BOX" ? data.boxId : null,
      boxIds: data.scope === "MULTIPLE" ? data.boxIds || [] : [],
      periodMonth: data.scope === "PERIOD" ? data.periodMonth : null,
      periodYear: data.scope === "PERIOD" ? data.periodYear : null,
      password: data.password || null,
      expiresAt,
      maxViews: data.maxViews || null,
      showAmounts: data.showAmounts ?? true,
      showContacts: data.showContacts ?? true,
      allowDownload: data.allowDownload ?? true,
      createdById: session.id,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  revalidatePath("/documents");
  return {
    success: true,
    data: {
      id: link.id,
      token: link.token,
      shareUrl: `${baseUrl}/share/${link.token}`,
    },
  };
}

/**
 * Delete a share link
 */
export async function deleteShareLink(id: string): Promise<ApiResponse<void | undefined>> {
  const session = await requireOrganization();

  const link = await prisma.shareLink.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!link) {
    return { success: false, error: "ไม่พบลิงก์แชร์" };
  }

  await prisma.shareLink.delete({ where: { id } });

  revalidatePath("/documents");
  return { success: true, data: undefined };
}

/**
 * Get share link data for public view (no auth required)
 */
export async function getShareLinkPublic(token: string, password?: string): Promise<ApiResponse<{
  organizationName: string;
  scope: ShareScope;
  showAmounts: boolean;
  showContacts: boolean;
  allowDownload: boolean;
  boxes: Array<{
    id: string;
    boxNumber: string;
    boxType: string;
    boxDate: string;
    title: string | null;
    totalAmount: number | null;
    vatAmount: number | null;
    whtAmount: number | null;
    status: string;
    docStatus: string;
    contact: { name: string } | null;
    category: { name: string } | null;
    documents: Array<{
      docType: string;
      files: Array<{
        fileName: string;
        fileUrl: string;
        mimeType: string;
      }>;
    }>;
  }>;
}>> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
    },
  });

  if (!link) {
    return { success: false, error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" };
  }

  // Check expiration
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { success: false, error: "ลิงก์หมดอายุแล้ว" };
  }

  // Check max views
  if (link.maxViews && link.viewCount >= link.maxViews) {
    return { success: false, error: "ลิงก์ถูกใช้งานครบจำนวนครั้งแล้ว" };
  }

  // Check password
  if (link.password && link.password !== password) {
    return { success: false, error: "รหัสผ่านไม่ถูกต้อง" };
  }

  // Get boxes based on scope
  let boxIds: string[] = [];
  
  if (link.scope === "BOX" && link.boxId) {
    boxIds = [link.boxId];
  } else if (link.scope === "MULTIPLE") {
    boxIds = link.boxIds;
  } else if (link.scope === "PERIOD" && link.periodMonth && link.periodYear) {
    const periodBoxes = await prisma.box.findMany({
      where: {
        organizationId: link.organizationId,
        boxDate: {
          gte: new Date(link.periodYear, link.periodMonth - 1, 1),
          lt: new Date(link.periodYear, link.periodMonth, 1),
        },
      },
      select: { id: true },
    });
    boxIds = periodBoxes.map(b => b.id);
  }

  const boxes = await prisma.box.findMany({
    where: { id: { in: boxIds } },
    include: {
      contact: link.showContacts ? { select: { name: true } } : false,
      category: { select: { name: true } },
      documents: {
        include: {
          files: {
            select: {
              fileName: true,
              fileUrl: true,
              mimeType: true,
            },
          },
        },
      },
    },
    orderBy: { boxDate: "desc" },
  });

  // Update view count
  await prisma.shareLink.update({
    where: { id: link.id },
    data: {
      viewCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

  return {
    success: true,
    data: {
      organizationName: link.organization.name,
      scope: link.scope,
      showAmounts: link.showAmounts,
      showContacts: link.showContacts,
      allowDownload: link.allowDownload,
      boxes: boxes.map(box => ({
        id: box.id,
        boxNumber: box.boxNumber,
        boxType: box.boxType,
        boxDate: box.boxDate.toISOString(),
        title: box.title,
        totalAmount: link.showAmounts ? box.totalAmount.toNumber() : null,
        vatAmount: link.showAmounts ? box.vatAmount.toNumber() : null,
        whtAmount: link.showAmounts ? box.whtAmount.toNumber() : null,
        status: box.status,
        docStatus: box.docStatus,
        contact: link.showContacts && box.contact ? { name: box.contact.name } : null,
        category: box.category ? { name: box.category.name } : null,
        documents: box.documents.map(doc => ({
          docType: doc.docType,
          files: doc.files,
        })),
      })),
    },
  };
}

/**
 * Check if share link requires password
 */
export async function checkShareLinkPassword(token: string): Promise<ApiResponse<{
  requiresPassword: boolean;
  name: string | null;
}>> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: { password: true, name: true },
  });

  if (!link) {
    return { success: false, error: "ลิงก์ไม่ถูกต้อง" };
  }

  return {
    success: true,
    data: {
      requiresPassword: !!link.password,
      name: link.name,
    },
  };
}
