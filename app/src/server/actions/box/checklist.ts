"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { getAutoChecklistUpdates, determineDocStatus } from "@/lib/checklist";
import type { ApiResponse } from "@/types";
import { PaymentStatus } from "@prisma/client";

// ==================== Toggle Checklist Item ====================

export async function toggleChecklistItem(boxId: string, itemId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  let message = "";

  // Handle different checklist items
  switch (itemId) {
    case "isPaid":
    case "payment": {
      // Toggle payment status: UNPAID <-> PAID
      // "payment" is the new unified item, "isPaid" kept for backward compatibility
      const newStatus = box.paymentStatus === PaymentStatus.PAID 
        ? PaymentStatus.UNPAID 
        : PaymentStatus.PAID;
      
      const paidAmount = newStatus === PaymentStatus.PAID 
        ? box.totalAmount 
        : 0;

      await prisma.box.update({
        where: { id: boxId },
        data: {
          paymentStatus: newStatus,
          paidAmount,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newStatus === PaymentStatus.PAID ? "MARK_PAID" : "MARK_UNPAID",
          details: newStatus === PaymentStatus.PAID 
            ? "ยืนยันการชำระเงินสด (ไม่มีหลักฐาน)" 
            : "ยกเลิกการยืนยันชำระเงิน",
        },
      });

      message = newStatus === PaymentStatus.PAID 
        ? "ยืนยันการชำระเงินสำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }
    
    case "whtSent": {
      // Toggle WHT sent status
      const newWhtSent = !box.whtSent;
      
      await prisma.box.update({
        where: { id: boxId },
        data: { whtSent: newWhtSent },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newWhtSent ? "WHT_SENT" : "WHT_UNSENT",
          details: newWhtSent 
            ? "ยืนยันส่งหนังสือหัก ณ ที่จ่ายแล้ว" 
            : "ยกเลิกการยืนยันส่ง WHT",
        },
      });

      message = newWhtSent 
        ? "ยืนยันส่ง WHT สำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }

    case "hasCashReceipt": {
      // Toggle "ไม่มีบิลเงินสด" status for NO_VAT expense type
      const noCashReceiptConfirmed = box.noReceiptReason === "NO_CASH_RECEIPT";
      const newNoReceiptReason = noCashReceiptConfirmed ? null : "NO_CASH_RECEIPT";
      
      await prisma.box.update({
        where: { id: boxId },
        data: { noReceiptReason: newNoReceiptReason },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newNoReceiptReason ? "NO_CASH_RECEIPT" : "HAS_CASH_RECEIPT",
          details: newNoReceiptReason 
            ? "ยืนยันว่าไม่มีบิลเงินสด" 
            : "ยกเลิกการยืนยันไม่มีบิลเงินสด",
        },
      });

      message = newNoReceiptReason 
        ? "ยืนยันไม่มีบิลเงินสดสำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }

    case "enableWht": {
      // Enable WHT for this box with default 3% rate
      if (box.hasWht) {
        return {
          success: false,
          error: "กล่องนี้มีหัก ณ ที่จ่ายอยู่แล้ว",
        };
      }

      const defaultWhtRate = 3;
      const baseAmount = box.hasVat 
        ? box.totalAmount.toNumber() / 1.07 
        : box.totalAmount.toNumber();
      const whtAmount = Math.round(baseAmount * (defaultWhtRate / 100) * 100) / 100;

      await prisma.box.update({
        where: { id: boxId },
        data: {
          hasWht: true,
          whtRate: defaultWhtRate,
          whtAmount,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: "ENABLE_WHT",
          details: `เปิดใช้หัก ณ ที่จ่าย ${defaultWhtRate}% (${whtAmount} บาท)`,
        },
      });

      message = "เปิดใช้หัก ณ ที่จ่ายสำเร็จ";
      break;
    }

    default:
      return {
        success: false,
        error: "ไม่รู้จักรายการที่ต้องการ toggle",
      };
  }

  // Recalculate checklist
  await recalculateBoxChecklist(boxId);

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message,
  };
}

// ==================== Enable WHT for Box ====================

export async function enableWht(boxId: string, whtRate: number = 3): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  if (box.hasWht) {
    return {
      success: false,
      error: "กล่องนี้มีหัก ณ ที่จ่ายอยู่แล้ว",
    };
  }

  // Calculate WHT amount from total (assume base is total amount before VAT)
  const baseAmount = box.hasVat 
    ? box.totalAmount.toNumber() / 1.07 
    : box.totalAmount.toNumber();
  const whtAmount = Math.round(baseAmount * (whtRate / 100) * 100) / 100;

  await prisma.box.update({
    where: { id: boxId },
    data: {
      hasWht: true,
      whtRate,
      whtAmount,
    },
  });

  revalidatePath(`/documents/${boxId}`);

  return {
    success: true,
    message: "เปิดใช้หัก ณ ที่จ่ายเรียบร้อย",
  };
}

// ==================== Recalculate Box Checklist ====================

export async function recalculateBoxChecklist(boxId: string): Promise<void> {
  const box = await prisma.box.findFirst({
    where: { id: boxId },
    include: { documents: true },
  });

  if (!box) return;

  const uploadedDocTypes = new Set(box.documents.map((d) => d.docType));

  // Build checklist state (from box fields if they exist)
  const checklist = {
    isPaid: box.paymentStatus === PaymentStatus.PAID,
    hasPaymentProof: false,
    hasTaxInvoice: false,
    hasInvoice: false,
    whtIssued: false,
    whtSent: box.whtSent,
    whtReceived: false,
  };

  // Get auto-updates from uploaded docs
  const autoUpdates = getAutoChecklistUpdates(uploadedDocTypes);
  Object.assign(checklist, autoUpdates);

  // Determine doc status
  const docStatus = determineDocStatus(
    box.boxType,
    box.expenseType,
    box.hasVat,
    box.hasWht,
    checklist,
    uploadedDocTypes,
    box.noReceiptReason
  );

  await prisma.box.update({
    where: { id: boxId },
    data: {
      docStatus,
    },
  });
}
