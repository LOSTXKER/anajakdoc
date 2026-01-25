"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { sendDocumentRequestNotification } from "@/lib/external-notifications";
import type { VatDocStatus, WhtDocStatus } from "@/types";

// ==================== VAT Document Status ====================

export async function updateVatDocStatus(
  boxId: string,
  status: VatDocStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };
    }

    // Check if user has access to this box
    const box = await prisma.box.findFirst({
      where: {
        id: boxId,
        organizationId: session.currentOrganization?.id,
      },
    });

    if (!box) {
      return { success: false, error: "ไม่พบกล่องเอกสาร" };
    }

    // Update VAT document status
    await prisma.box.update({
      where: { id: boxId },
      data: {
        vatDocStatus: status,
        vatVerifiedAt: status === "VERIFIED" ? new Date() : null,
        vatVerifiedById: status === "VERIFIED" ? session.id : null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "VAT_STATUS_UPDATE",
        details: {
          oldValue: box.vatDocStatus,
          newValue: status,
        },
      },
    });

    revalidatePath(`/documents/${boxId}`);
    revalidatePath("/documents");

    return { success: true };
  } catch (error) {
    console.error("Error updating VAT doc status:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" };
  }
}

// ==================== WHT Document Status ====================

export async function updateWhtDocStatus(
  boxId: string,
  status: WhtDocStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };
    }

    // Check if user has access to this box
    const box = await prisma.box.findFirst({
      where: {
        id: boxId,
        organizationId: session.currentOrganization?.id,
      },
    });

    if (!box) {
      return { success: false, error: "ไม่พบกล่องเอกสาร" };
    }

    // Update WHT document status
    await prisma.box.update({
      where: { id: boxId },
      data: {
        whtDocStatus: status,
        whtSent: status === "REQUEST_SENT" || status === "RECEIVED" || status === "VERIFIED",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "WHT_STATUS_UPDATE",
        details: {
          oldValue: box.whtDocStatus,
          newValue: status,
        },
      },
    });

    revalidatePath(`/documents/${boxId}`);
    revalidatePath("/documents");

    return { success: true };
  } catch (error) {
    console.error("Error updating WHT doc status:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" };
  }
}

// ==================== Mark Document as Received ====================

export async function markDocumentReceived(
  boxId: string,
  docType: "VAT" | "WHT"
): Promise<{ success: boolean; error?: string }> {
  if (docType === "VAT") {
    return updateVatDocStatus(boxId, "RECEIVED");
  } else {
    return updateWhtDocStatus(boxId, "RECEIVED");
  }
}

// ==================== Send Document Request ====================

export async function sendDocumentRequest(
  boxId: string,
  docType: "VAT" | "WHT"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };
    }

    // Check if user has access to this box
    const box = await prisma.box.findFirst({
      where: {
        id: boxId,
        organizationId: session.currentOrganization?.id,
      },
      include: {
        contact: true,
      },
    });

    if (!box) {
      return { success: false, error: "ไม่พบกล่องเอกสาร" };
    }

    if (!box.contact) {
      return { success: false, error: "ไม่พบข้อมูลคู่ค้า กรุณาเพิ่มคู่ค้าก่อนส่งคำขอ" };
    }

    // Update status to REQUEST_SENT (only for WHT)
    if (docType === "WHT") {
      await prisma.box.update({
        where: { id: boxId },
        data: {
          whtDocStatus: "REQUEST_SENT",
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: `${docType}_REQUEST_SENT`,
        details: {
          contactName: box.contact.name,
        },
      },
    });

    // Send notification to contact via Email/LINE
    if (box.contact) {
      const notificationResult = await sendDocumentRequestNotification(
        {
          name: box.contact.name,
          email: box.contact.email,
          phone: box.contact.phone,
        },
        docType === "VAT" ? "ใบกำกับภาษี (VAT)" : "หนังสือรับรองหัก ณ ที่จ่าย (WHT)",
        box.boxNumber,
        docType === "WHT" ? box.whtDueDate : undefined
      );

      console.log(`[Document Request] Notification sent to ${box.contact.name}:`, notificationResult);
    }

    revalidatePath(`/documents/${boxId}`);
    revalidatePath("/documents");

    return { success: true };
  } catch (error) {
    console.error("Error sending document request:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการส่งคำขอ" };
  }
}
