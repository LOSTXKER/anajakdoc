"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { MemberRole, FirmRole } from ".prisma/client";

// ============================================
// CREATE INVITATIONS
// ============================================

interface CreateOrgInviteInput {
  organizationId: string;
  email: string;
  role: MemberRole;
}

interface CreateFirmInviteInput {
  firmId: string;
  email: string;
  role: FirmRole;
}

/**
 * Create an invitation to join an organization
 */
export async function createOrganizationInvite(
  input: CreateOrgInviteInput
): Promise<ApiResponse<{ code: string; inviteUrl: string }>> {
  const session = await requireAuth();

  // Verify user has permission to invite
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: session.id,
      role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      isActive: true,
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    return { success: false, error: "คุณไม่มีสิทธิ์เชิญสมาชิก" };
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: existingUser.id,
        isActive: true,
      },
    });

    if (existingMember) {
      return { success: false, error: "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว" };
    }
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email: input.email,
      organizationId: input.organizationId,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    // Return existing invite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
      success: true,
      data: {
        code: existingInvite.code,
        inviteUrl: `${baseUrl}/invite/${existingInvite.code}`,
      },
    };
  }

  // Create new invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email: input.email,
      organizationId: input.organizationId,
      role: input.role,
      invitedById: session.id,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  revalidatePath("/settings/members");

  return {
    success: true,
    data: {
      code: invitation.code,
      inviteUrl: `${baseUrl}/invite/${invitation.code}`,
    },
  };
}

/**
 * Create an invitation to join an accounting firm
 */
export async function createFirmInvite(
  input: CreateFirmInviteInput
): Promise<ApiResponse<{ code: string; inviteUrl: string }>> {
  const session = await requireAuth();

  // Verify user has permission to invite
  const firmMember = await prisma.firmMember.findFirst({
    where: {
      firmId: input.firmId,
      userId: session.id,
      role: { in: [FirmRole.OWNER, FirmRole.ADMIN] },
      isActive: true,
    },
    include: {
      firm: true,
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่มีสิทธิ์เชิญสมาชิก" };
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const existingMember = await prisma.firmMember.findFirst({
      where: {
        firmId: input.firmId,
        userId: existingUser.id,
        isActive: true,
      },
    });

    if (existingMember) {
      return { success: false, error: "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว" };
    }
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email: input.email,
      firmId: input.firmId,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
      success: true,
      data: {
        code: existingInvite.code,
        inviteUrl: `${baseUrl}/invite/${existingInvite.code}`,
      },
    };
  }

  // Create new invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email: input.email,
      firmId: input.firmId,
      role: input.role,
      invitedById: session.id,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  revalidatePath("/firm/team");

  return {
    success: true,
    data: {
      code: invitation.code,
      inviteUrl: `${baseUrl}/invite/${invitation.code}`,
    },
  };
}

// ============================================
// GET INVITATION INFO (Public)
// ============================================

export interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  type: "organization" | "firm";
  targetName: string;
  invitedByName: string | null;
  isExpired: boolean;
  isAccepted: boolean;
}

/**
 * Get invitation details by code (public - no auth required)
 */
export async function getInvitationByCode(
  code: string
): Promise<ApiResponse<InvitationInfo>> {
  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: {
      organization: { select: { name: true } },
      firm: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invitation) {
    return { success: false, error: "ไม่พบคำเชิญนี้" };
  }

  const isExpired = invitation.expiresAt < new Date();
  const isAccepted = invitation.status === "ACCEPTED";

  if (invitation.status === "CANCELLED") {
    return { success: false, error: "คำเชิญนี้ถูกยกเลิกแล้ว" };
  }

  const type = invitation.organizationId ? "organization" : "firm";
  const targetName = invitation.organization?.name || invitation.firm?.name || "";

  return {
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      type,
      targetName,
      invitedByName: invitation.invitedBy.name,
      isExpired,
      isAccepted,
    },
  };
}

// ============================================
// ACCEPT INVITATION
// ============================================

/**
 * Accept an invitation (requires auth - user must be logged in)
 */
export async function acceptInvitation(code: string): Promise<ApiResponse> {
  const session = await requireAuth();

  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: {
      organization: true,
      firm: true,
    },
  });

  if (!invitation) {
    return { success: false, error: "ไม่พบคำเชิญนี้" };
  }

  // Check if already accepted
  if (invitation.status === "ACCEPTED") {
    return { success: false, error: "คำเชิญนี้ถูกยอมรับแล้ว" };
  }

  // Check if cancelled
  if (invitation.status === "CANCELLED") {
    return { success: false, error: "คำเชิญนี้ถูกยกเลิกแล้ว" };
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "คำเชิญนี้หมดอายุแล้ว" };
  }

  // Verify email matches (optional - can be removed for more flexibility)
  if (invitation.email.toLowerCase() !== session.email.toLowerCase()) {
    return { 
      success: false, 
      error: `คำเชิญนี้ส่งถึง ${invitation.email} กรุณาเข้าสู่ระบบด้วยอีเมลที่ถูกต้อง` 
    };
  }

  // Accept invitation based on type
  if (invitation.organizationId) {
    // Organization invite
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.id,
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        return { success: false, error: "คุณเป็นสมาชิกขององค์กรนี้อยู่แล้ว" };
      }

      // Reactivate membership
      await prisma.organizationMember.update({
        where: { id: existingMember.id },
        data: {
          isActive: true,
          role: invitation.role as MemberRole,
          joinedAt: new Date(),
        },
      });
    } else {
      // Create new membership
      await prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: session.id,
          role: invitation.role as MemberRole,
          joinedAt: new Date(),
        },
      });
    }

    revalidatePath("/settings/members");
  } else if (invitation.firmId) {
    // Firm invite
    const existingMember = await prisma.firmMember.findFirst({
      where: {
        firmId: invitation.firmId,
        userId: session.id,
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        return { success: false, error: "คุณเป็นสมาชิกของสำนักงานนี้อยู่แล้ว" };
      }

      // Reactivate membership
      await prisma.firmMember.update({
        where: { id: existingMember.id },
        data: {
          isActive: true,
          role: invitation.role as FirmRole,
        },
      });
    } else {
      // Create new membership
      await prisma.firmMember.create({
        data: {
          firmId: invitation.firmId,
          userId: session.id,
          role: invitation.role as FirmRole,
        },
      });
    }

    revalidatePath("/firm/team");
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  return { success: true, message: "ยอมรับคำเชิญเรียบร้อยแล้ว" };
}

// ============================================
// CANCEL INVITATION
// ============================================

/**
 * Cancel an invitation (admin only)
 */
export async function cancelInvitation(invitationId: string): Promise<ApiResponse> {
  const session = await requireAuth();

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    return { success: false, error: "ไม่พบคำเชิญนี้" };
  }

  // Check permission
  if (invitation.organizationId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.id,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
        isActive: true,
      },
    });

    if (!membership) {
      return { success: false, error: "คุณไม่มีสิทธิ์ยกเลิกคำเชิญนี้" };
    }
  } else if (invitation.firmId) {
    const firmMember = await prisma.firmMember.findFirst({
      where: {
        firmId: invitation.firmId,
        userId: session.id,
        role: { in: [FirmRole.OWNER, FirmRole.ADMIN] },
        isActive: true,
      },
    });

    if (!firmMember) {
      return { success: false, error: "คุณไม่มีสิทธิ์ยกเลิกคำเชิญนี้" };
    }
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/settings/members");
  revalidatePath("/firm/team");

  return { success: true, message: "ยกเลิกคำเชิญเรียบร้อยแล้ว" };
}

// ============================================
// LIST PENDING INVITATIONS
// ============================================

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  inviteUrl: string;
}

/**
 * Get pending invitations for an organization
 */
export async function getOrganizationPendingInvites(
  organizationId: string
): Promise<ApiResponse<PendingInvitation[]>> {
  const session = await requireAuth();

  // Verify permission
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId: session.id,
      role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      isActive: true,
    },
  });

  if (!membership) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดูคำเชิญ" };
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    success: true,
    data: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      inviteUrl: `${baseUrl}/invite/${inv.code}`,
    })),
  };
}

/**
 * Get pending invitations for a firm
 */
export async function getFirmPendingInvites(
  firmId: string
): Promise<ApiResponse<PendingInvitation[]>> {
  const session = await requireAuth();

  // Verify permission
  const firmMember = await prisma.firmMember.findFirst({
    where: {
      firmId,
      userId: session.id,
      role: { in: [FirmRole.OWNER, FirmRole.ADMIN] },
      isActive: true,
    },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดูคำเชิญ" };
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      firmId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    success: true,
    data: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      inviteUrl: `${baseUrl}/invite/${inv.code}`,
    })),
  };
}
