"use server";

import prisma from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

interface CreateAutoPaymentParams {
  boxId: string;
  amount: number;
  method: "TRANSFER" | "CHEQUE";
  documentId: string;
  reference?: string;
  notes?: string;
  isMultiPayment?: boolean;
  slipAmount?: number;
}

/**
 * Creates an automatic payment record when a slip is uploaded
 * and updates the box payment status accordingly.
 * 
 * This consolidates the auto-payment logic that was duplicated in:
 * - handleFileUploads (box.ts ~line 249-320)
 * - addFileToBox (box.ts ~line 1026-1080)
 */
export async function createAutoPaymentFromSlip({
  boxId,
  amount,
  method,
  documentId,
  reference,
  notes,
  isMultiPayment = false,
  slipAmount,
}: CreateAutoPaymentParams): Promise<{
  success: boolean;
  paymentId?: string;
  newPaidAmount?: number;
  newPaymentStatus?: PaymentStatus;
  isOverpaid?: boolean;
  overpaidAmount?: number;
}> {
  try {
    // Get current box state
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box) {
      console.error(`[createAutoPaymentFromSlip] Box not found: ${boxId}`);
      return { success: false };
    }

    const totalAmount = box.totalAmount.toNumber();
    if (totalAmount <= 0) {
      console.log(`[createAutoPaymentFromSlip] Skipping: totalAmount is ${totalAmount}`);
      return { success: false };
    }

    // Determine payment amount
    let paymentAmount: number;
    
    if (isMultiPayment && slipAmount && slipAmount > 0) {
      // Multi-payment mode: use the explicit slip amount
      paymentAmount = slipAmount;
      console.log(`[createAutoPaymentFromSlip] Multi-payment mode: ${slipAmount}`);
    } else if (amount > 0) {
      // Use provided amount (e.g., extracted from slip via OCR)
      paymentAmount = amount;
    } else {
      // Calculate remaining amount
      const existingPaid = await prisma.payment.aggregate({
        where: { boxId },
        _sum: { amount: true },
      });
      const paidSoFar = existingPaid._sum.amount?.toNumber() || 0;
      paymentAmount = totalAmount - paidSoFar;
    }

    // Only create payment if there's amount to pay
    if (paymentAmount <= 0) {
      console.log(`[createAutoPaymentFromSlip] Skipping: paymentAmount is ${paymentAmount}`);
      return { success: false };
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        boxId,
        amount: paymentAmount,
        paidDate: new Date(),
        method,
        reference: reference || "Auto-generated",
        notes: notes || (
          isMultiPayment 
            ? "งวดแรก - บันทึกอัตโนมัติจากการอัปโหลดสลิป" 
            : "บันทึกอัตโนมัติจากการอัปโหลดสลิป"
        ),
        documentId,
      },
    });

    // Recalculate total paid
    const totalPaid = await prisma.payment.aggregate({
      where: { boxId },
      _sum: { amount: true },
    });
    
    const newPaidAmount = totalPaid._sum.amount?.toNumber() || 0;

    // Determine payment status
    let newPaymentStatus: PaymentStatus;
    if (newPaidAmount === 0) {
      newPaymentStatus = PaymentStatus.UNPAID;
    } else if (newPaidAmount < totalAmount) {
      newPaymentStatus = PaymentStatus.PARTIAL;
    } else if (newPaidAmount > totalAmount) {
      newPaymentStatus = PaymentStatus.OVERPAID;
    } else {
      newPaymentStatus = PaymentStatus.PAID;
    }

    // Update box payment status
    await prisma.box.update({
      where: { id: boxId },
      data: {
        paymentStatus: newPaymentStatus,
        paidAmount: newPaidAmount,
      },
    });

    const isOverpaid = newPaymentStatus === PaymentStatus.OVERPAID;
    const overpaidAmount = isOverpaid ? newPaidAmount - totalAmount : 0;

    console.log(`[createAutoPaymentFromSlip] Created payment ${payment.id} for box ${boxId}, amount: ${paymentAmount}, status: ${newPaymentStatus}${isOverpaid ? `, overpaid by ${overpaidAmount}` : ""}`);

    return {
      success: true,
      paymentId: payment.id,
      newPaidAmount,
      newPaymentStatus,
      isOverpaid,
      overpaidAmount,
    };
  } catch (error) {
    console.error("[createAutoPaymentFromSlip] Error:", error);
    return { success: false };
  }
}

/**
 * Recalculates and updates the payment status of a box
 * based on its current payments.
 */
export async function recalculateBoxPaymentStatus(boxId: string): Promise<{
  success: boolean;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
}> {
  try {
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box) {
      return { success: false };
    }

    const totalAmount = box.totalAmount.toNumber();
    
    const totalPaid = await prisma.payment.aggregate({
      where: { boxId },
      _sum: { amount: true },
    });
    
    const paidAmount = totalPaid._sum.amount?.toNumber() || 0;

    // Determine payment status
    let paymentStatus: PaymentStatus;
    if (paidAmount === 0) {
      paymentStatus = PaymentStatus.UNPAID;
    } else if (paidAmount < totalAmount) {
      paymentStatus = PaymentStatus.PARTIAL;
    } else if (paidAmount > totalAmount) {
      paymentStatus = PaymentStatus.OVERPAID;
    } else {
      paymentStatus = PaymentStatus.PAID;
    }

    // Update box
    await prisma.box.update({
      where: { id: boxId },
      data: {
        paymentStatus,
        paidAmount,
      },
    });

    return { success: true, paidAmount, paymentStatus };
  } catch (error) {
    console.error("[recalculateBoxPaymentStatus] Error:", error);
    return { success: false };
  }
}
