"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { calculatePaymentStatus } from "@/lib/helpers/payment";
import type { ApiResponse, CreatePaymentInput } from "@/types";
import { PaymentStatus } from "@prisma/client";
import { ERROR_MESSAGES } from "@/lib/error-messages";

// ==================== Create Payment ====================

export async function createPayment(input: CreatePaymentInput): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();
  
  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: input.boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      boxId: input.boxId,
      amount: input.amount,
      paidDate: input.paidDate,
      method: input.method,
      reference: input.reference || null,
      notes: input.notes || null,
      documentId: input.documentId || null,
    },
  });

  // Update box paid amount and payment status
  const totalPaid = await prisma.payment.aggregate({
    where: { boxId: input.boxId },
    _sum: { amount: true },
  });

  const paidAmount = totalPaid._sum.amount?.toNumber() || 0;
  const totalAmount = box.totalAmount.toNumber();

  const paymentStatus = calculatePaymentStatus(paidAmount, totalAmount);

  await prisma.box.update({
    where: { id: input.boxId },
    data: {
      paidAmount,
      paymentStatus,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: input.boxId,
      userId: session.id,
      action: "PAYMENT_ADDED",
      details: {
        amount: input.amount,
        method: input.method,
        paidDate: input.paidDate.toISOString(),
      },
    },
  });

  revalidatePath(`/documents/${input.boxId}`);
  revalidatePath("/documents");

  return { success: true, data: { id: payment.id } };
}

// ==================== Update Payment ====================

export async function updatePayment(
  paymentId: string,
  input: Partial<Omit<CreatePaymentInput, "boxId">>
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Find payment and verify access
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      box: {
        select: {
          id: true,
          organizationId: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!payment || payment.box.organizationId !== session.currentOrganization.id) {
    return { success: false, error: "ไม่พบรายการจ่ายเงิน" };
  }

  // Update payment
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      amount: input.amount,
      paidDate: input.paidDate,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      documentId: input.documentId,
    },
  });

  // Recalculate box paid amount
  const totalPaid = await prisma.payment.aggregate({
    where: { boxId: payment.boxId },
    _sum: { amount: true },
  });

  const paidAmount = totalPaid._sum.amount?.toNumber() || 0;
  const totalAmount = payment.box.totalAmount.toNumber();

  let paymentStatus: PaymentStatus;
  if (paidAmount === 0) {
    paymentStatus = PaymentStatus.UNPAID;
  } else if (paidAmount < totalAmount) {
    paymentStatus = PaymentStatus.PARTIAL;
  } else if (paidAmount === totalAmount) {
    paymentStatus = PaymentStatus.PAID;
  } else {
    paymentStatus = PaymentStatus.OVERPAID;
  }

  await prisma.box.update({
    where: { id: payment.boxId },
    data: {
      paidAmount,
      paymentStatus,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: payment.boxId,
      userId: session.id,
      action: "PAYMENT_UPDATED",
      details: { paymentId },
    },
  });

  revalidatePath(`/documents/${payment.boxId}`);
  revalidatePath("/documents");

  return { success: true, message: "อัปเดตรายการจ่ายเงินเรียบร้อย" };
}

// ==================== Delete Payment ====================

export async function deletePayment(paymentId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Find payment and verify access
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      box: {
        select: {
          id: true,
          organizationId: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!payment || payment.box.organizationId !== session.currentOrganization.id) {
    return { success: false, error: "ไม่พบรายการจ่ายเงิน" };
  }

  const boxId = payment.boxId;

  // Delete payment
  await prisma.payment.delete({
    where: { id: paymentId },
  });

  // Recalculate box paid amount
  const totalPaid = await prisma.payment.aggregate({
    where: { boxId },
    _sum: { amount: true },
  });

  const paidAmount = totalPaid._sum.amount?.toNumber() || 0;
  const totalAmount = payment.box.totalAmount.toNumber();

  let paymentStatus: PaymentStatus;
  if (paidAmount === 0) {
    paymentStatus = PaymentStatus.UNPAID;
  } else if (paidAmount < totalAmount) {
    paymentStatus = PaymentStatus.PARTIAL;
  } else if (paidAmount === totalAmount) {
    paymentStatus = PaymentStatus.PAID;
  } else {
    paymentStatus = PaymentStatus.OVERPAID;
  }

  await prisma.box.update({
    where: { id: boxId },
    data: {
      paidAmount,
      paymentStatus,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "PAYMENT_DELETED",
      details: { paymentId },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");

  return { success: true, message: "ลบรายการจ่ายเงินเรียบร้อย" };
}

// ==================== Get Payments ====================

export async function getPayments(boxId: string) {
  const session = await requireOrganization();

  const payments = await prisma.payment.findMany({
    where: {
      boxId,
      box: {
        organizationId: session.currentOrganization.id,
      },
    },
    orderBy: { paidDate: "desc" },
  });

  return payments.map((p) => ({
    ...p,
    amount: p.amount.toNumber(),
    paidDate: p.paidDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }));
}

// ==================== Mark Box as Paid ====================

export async function markBoxAsPaid(
  boxId: string,
  input: {
    method: "TRANSFER" | "CHEQUE" | "CASH" | "CREDIT_CARD" | "ONLINE";
    reference?: string;
    notes?: string;
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
  }

  // Create a payment for the remaining amount
  const remainingAmount = box.totalAmount.toNumber() - box.paidAmount.toNumber();
  
  if (remainingAmount <= 0) {
    return { success: false, error: "กล่องนี้จ่ายครบแล้ว" };
  }

  await prisma.payment.create({
    data: {
      boxId,
      amount: remainingAmount,
      paidDate: new Date(),
      method: input.method,
      reference: input.reference || null,
      notes: input.notes || null,
    },
  });

  // Update box
  await prisma.box.update({
    where: { id: boxId },
    data: {
      paidAmount: box.totalAmount,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "MARKED_AS_PAID",
      details: {
        amount: remainingAmount,
        method: input.method,
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");

  return { success: true, message: "บันทึกการจ่ายเงินเรียบร้อย" };
}

// ==================== Mark Box as Received (for Income) ====================

export async function markBoxAsReceived(
  boxId: string,
  input: {
    method: "TRANSFER" | "CHEQUE" | "CASH" | "CREDIT_CARD" | "ONLINE";
    reference?: string;
    notes?: string;
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      boxType: "INCOME",
    },
  });

  if (!box) {
    return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
  }

  const remainingAmount = box.totalAmount.toNumber() - box.paidAmount.toNumber();
  
  if (remainingAmount <= 0) {
    return { success: false, error: "กล่องนี้รับเงินครบแล้ว" };
  }

  await prisma.payment.create({
    data: {
      boxId,
      amount: remainingAmount,
      paidDate: new Date(),
      method: input.method,
      reference: input.reference || null,
      notes: input.notes || null,
    },
  });

  await prisma.box.update({
    where: { id: boxId },
    data: {
      paidAmount: box.totalAmount,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "MARKED_AS_RECEIVED",
      details: {
        amount: remainingAmount,
        method: input.method,
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");

  return { success: true, message: "บันทึกการรับเงินเรียบร้อย" };
}
