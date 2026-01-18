"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse, CreateWHTTrackingInput, UpdateWHTTrackingInput } from "@/types";
import { revalidatePath } from "next/cache";
import type { WHTStatus, WHTTrackingType } from ".prisma/client";

// Create WHT Tracking
export async function createWHTTracking(
  input: CreateWHTTrackingInput
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสารหลัก" };
  }

  const whtTracking = await prisma.wHTTracking.create({
    data: {
      organizationId: session.currentOrganization.id,
      documentId: input.documentId,
      trackingType: input.trackingType,
      whtAmount: input.whtAmount,
      whtRate: input.whtRate,
      contactId: input.contactId,
      counterpartyName: input.counterpartyName,
      notes: input.notes,
      status: "PENDING",
    },
  });

  // Update document hasWht flag
  await prisma.document.update({
    where: { id: input.documentId },
    data: {
      hasWht: true,
      whtAmount: input.whtAmount,
      whtRate: input.whtRate,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: input.documentId,
      userId: session.id,
      action: "wht_tracking_created",
      details: {
        whtTrackingId: whtTracking.id,
        trackingType: input.trackingType,
        whtAmount: input.whtAmount,
      },
    },
  });

  revalidatePath(`/documents/${input.documentId}`);
  revalidatePath("/wht-tracking");

  return { success: true, data: { id: whtTracking.id } };
}

// Update WHT Tracking
export async function updateWHTTracking(
  whtTrackingId: string,
  input: UpdateWHTTrackingInput
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify WHT tracking belongs to organization
  const whtTracking = await prisma.wHTTracking.findFirst({
    where: {
      id: whtTrackingId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  await prisma.wHTTracking.update({
    where: { id: whtTrackingId },
    data: {
      whtAmount: input.whtAmount,
      whtRate: input.whtRate,
      contactId: input.contactId,
      counterpartyName: input.counterpartyName,
      status: input.status,
      issuedDate: input.issuedDate,
      sentDate: input.sentDate,
      sentMethod: input.sentMethod,
      confirmedDate: input.confirmedDate,
      receivedDate: input.receivedDate,
      fileUrl: input.fileUrl,
      notes: input.notes,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: whtTracking.documentId,
      userId: session.id,
      action: "wht_tracking_updated",
      details: {
        whtTrackingId,
        changes: input,
      },
    },
  });

  revalidatePath(`/documents/${whtTracking.documentId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "อัปเดต WHT เรียบร้อย" };
}

// Update WHT Tracking Status
export async function updateWHTStatus(
  whtTrackingId: string,
  status: WHTStatus,
  additionalData?: {
    issuedDate?: Date;
    sentDate?: Date;
    sentMethod?: "EMAIL" | "MAIL" | "HAND_DELIVERY" | "OTHER";
    confirmedDate?: Date;
    receivedDate?: Date;
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const whtTracking = await prisma.wHTTracking.findFirst({
    where: {
      id: whtTrackingId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  await prisma.wHTTracking.update({
    where: { id: whtTrackingId },
    data: {
      status,
      ...additionalData,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: whtTracking.documentId,
      userId: session.id,
      action: "wht_status_changed",
      details: {
        whtTrackingId,
        newStatus: status,
        ...additionalData,
      },
    },
  });

  revalidatePath(`/documents/${whtTracking.documentId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "อัปเดตสถานะ WHT เรียบร้อย" };
}

// Delete WHT Tracking
export async function deleteWHTTracking(
  whtTrackingId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const whtTracking = await prisma.wHTTracking.findFirst({
    where: {
      id: whtTrackingId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!whtTracking) {
    return { success: false, error: "ไม่พบรายการ WHT" };
  }

  await prisma.wHTTracking.delete({
    where: { id: whtTrackingId },
  });

  // Check if document still has other WHT trackings
  const remainingWht = await prisma.wHTTracking.count({
    where: { documentId: whtTracking.documentId },
  });

  if (remainingWht === 0) {
    await prisma.document.update({
      where: { id: whtTracking.documentId },
      data: {
        hasWht: false,
        whtAmount: 0,
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: whtTracking.documentId,
      userId: session.id,
      action: "wht_tracking_deleted",
      details: {
        whtTrackingId,
      },
    },
  });

  revalidatePath(`/documents/${whtTracking.documentId}`);
  revalidatePath("/wht-tracking");

  return { success: true, message: "ลบรายการ WHT เรียบร้อย" };
}

// Get WHT Trackings for organization
export async function getWHTTrackings(filters?: {
  trackingType?: WHTTrackingType;
  status?: WHTStatus[];
  documentId?: string;
}) {
  const session = await requireOrganization();

  const whtTrackings = await prisma.wHTTracking.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      ...(filters?.trackingType && { trackingType: filters.trackingType }),
      ...(filters?.status && { status: { in: filters.status } }),
      ...(filters?.documentId && { documentId: filters.documentId }),
    },
    include: {
      document: {
        select: {
          id: true,
          docNumber: true,
          description: true,
          totalAmount: true,
          docDate: true,
        },
      },
      contact: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return whtTrackings;
}

// Get WHT Summary
export async function getWHTSummary() {
  const session = await requireOrganization();

  const [outgoingPending, outgoingSent, incomingPending, incomingReceived] = await Promise.all([
    prisma.wHTTracking.count({
      where: {
        organizationId: session.currentOrganization.id,
        trackingType: "OUTGOING",
        status: { in: ["PENDING", "ISSUED"] },
      },
    }),
    prisma.wHTTracking.count({
      where: {
        organizationId: session.currentOrganization.id,
        trackingType: "OUTGOING",
        status: "SENT",
      },
    }),
    prisma.wHTTracking.count({
      where: {
        organizationId: session.currentOrganization.id,
        trackingType: "INCOMING",
        status: "PENDING",
      },
    }),
    prisma.wHTTracking.count({
      where: {
        organizationId: session.currentOrganization.id,
        trackingType: "INCOMING",
        status: "RECEIVED",
      },
    }),
  ]);

  return {
    outgoing: {
      pending: outgoingPending,
      sent: outgoingSent,
    },
    incoming: {
      pending: incomingPending,
      received: incomingReceived,
    },
  };
}

