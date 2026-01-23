"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse, CreateWhtTrackingInput, UpdateWhtTrackingInput } from "@/types";
import { revalidatePath } from "next/cache";
import type { WhtStatus, WhtType } from ".prisma/client";

// Create WHT Tracking
export async function createWhtTracking(
  input: CreateWhtTrackingInput
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: input.boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const whtTracking = await prisma.whtTracking.create({
    data: {
      boxId: input.boxId,
      type: input.type,
      amount: input.amount,
      rate: input.rate,
      contactId: input.contactId,
      notes: input.notes,
      status: "PENDING",
    },
  });

  // Update box hasWht flag
  await prisma.box.update({
    where: { id: input.boxId },
    data: {
      hasWht: true,
      whtAmount: input.amount,
      whtRate: input.rate,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: input.boxId,
      userId: session.id,
      action: "WHT_TRACKING_CREATED",
      details: {
        whtTrackingId: whtTracking.id,
        type: input.type,
        amount: input.amount,
      },
    },
  });

  revalidatePath(`/documents/${input.boxId}`);
  revalidatePath("/wht-tracking");

  return { success: true, data: { id: whtTracking.id } };
}

// Update WHT Tracking
export async function updateWhtTracking(
  whtTrackingId: string,
  input: UpdateWhtTrackingInput
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify WHT tracking belongs to organization
  const whtTracking = await prisma.whtTracking.findFirst({
    where: {
      id: whtTrackingId,
      box: {
        organizationId: session.currentOrganization.id,
      },
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  await prisma.whtTracking.update({
    where: { id: whtTrackingId },
    data: {
      amount: input.amount,
      rate: input.rate,
      contactId: input.contactId,
      status: input.status,
      issuedDate: input.issuedDate,
      sentDate: input.sentDate,
      sentMethod: input.sentMethod,
      receivedDate: input.receivedDate,
      documentId: input.documentId,
      notes: input.notes,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: whtTracking.boxId,
      userId: session.id,
      action: "WHT_TRACKING_UPDATED",
      details: {
        whtTrackingId,
        changes: input,
      },
    },
  });

  revalidatePath(`/documents/${whtTracking.boxId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "อัปเดต WHT เรียบร้อย" };
}

// Update WHT Tracking Status
export async function updateWhtStatus(
  whtTrackingId: string,
  status: WhtStatus,
  additionalData?: {
    issuedDate?: Date;
    sentDate?: Date;
    sentMethod?: "EMAIL" | "MAIL" | "HAND_DELIVERY" | "OTHER";
    receivedDate?: Date;
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const whtTracking = await prisma.whtTracking.findFirst({
    where: {
      id: whtTrackingId,
      box: {
        organizationId: session.currentOrganization.id,
      },
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  await prisma.whtTracking.update({
    where: { id: whtTrackingId },
    data: {
      status,
      ...additionalData,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: whtTracking.boxId,
      userId: session.id,
      action: "WHT_STATUS_CHANGED",
      details: {
        whtTrackingId,
        newStatus: status,
        ...additionalData,
      },
    },
  });

  revalidatePath(`/documents/${whtTracking.boxId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "อัปเดตสถานะ WHT เรียบร้อย" };
}

// Delete WHT Tracking
export async function deleteWhtTracking(
  whtTrackingId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const whtTracking = await prisma.whtTracking.findFirst({
    where: {
      id: whtTrackingId,
      box: {
        organizationId: session.currentOrganization.id,
      },
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  const boxId = whtTracking.boxId;

  await prisma.whtTracking.delete({
    where: { id: whtTrackingId },
  });

  // Check if box still has other WHT trackings
  const remainingWht = await prisma.whtTracking.count({
    where: { boxId },
  });

  if (remainingWht === 0) {
    await prisma.box.update({
      where: { id: boxId },
      data: {
        hasWht: false,
        whtAmount: 0,
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "WHT_TRACKING_DELETED",
      details: {
        whtTrackingId,
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "ลบรายการ WHT เรียบร้อย" };
}

// Get WHT Trackings for organization
export async function getWhtTrackings(filters?: {
  type?: WhtType;
  status?: WhtStatus[];
  boxId?: string;
}) {
  const session = await requireOrganization();

  const whtTrackings = await prisma.whtTracking.findMany({
    where: {
      box: {
        organizationId: session.currentOrganization.id,
      },
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: { in: filters.status } }),
      ...(filters?.boxId && { boxId: filters.boxId }),
    },
    include: {
      box: {
        select: {
          id: true,
          boxNumber: true,
          title: true,
          totalAmount: true,
          boxDate: true,
        },
      },
      contact: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return whtTrackings;
}

// Get WHT Summary with counts and amounts
export async function getWhtSummary() {
  const session = await requireOrganization();
  const orgId = session.currentOrganization.id;

  const [
    outgoingPendingData,
    outgoingSentData,
    incomingPendingData,
    incomingReceivedData,
  ] = await Promise.all([
    // Outgoing pending (count + sum)
    prisma.whtTracking.aggregate({
      where: {
        box: { organizationId: orgId },
        type: "OUTGOING",
        status: { in: ["PENDING", "ISSUED"] },
      },
      _count: true,
      _sum: { amount: true },
    }),
    // Outgoing sent (count + sum)
    prisma.whtTracking.aggregate({
      where: {
        box: { organizationId: orgId },
        type: "OUTGOING",
        status: "SENT",
      },
      _count: true,
      _sum: { amount: true },
    }),
    // Incoming pending (count + sum)
    prisma.whtTracking.aggregate({
      where: {
        box: { organizationId: orgId },
        type: "INCOMING",
        status: "PENDING",
      },
      _count: true,
      _sum: { amount: true },
    }),
    // Incoming received (count + sum)
    prisma.whtTracking.aggregate({
      where: {
        box: { organizationId: orgId },
        type: "INCOMING",
        status: "RECEIVED",
      },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    outgoing: {
      pending: outgoingPendingData._count,
      pendingAmount: outgoingPendingData._sum.amount?.toNumber() ?? 0,
      sent: outgoingSentData._count,
      sentAmount: outgoingSentData._sum.amount?.toNumber() ?? 0,
    },
    incoming: {
      pending: incomingPendingData._count,
      pendingAmount: incomingPendingData._sum.amount?.toNumber() ?? 0,
      received: incomingReceivedData._count,
      receivedAmount: incomingReceivedData._sum.amount?.toNumber() ?? 0,
    },
  };
}
