"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import type { ApiResponse } from "@/types";
import { DocumentStatus } from ".prisma/client";

export async function bulkApprove(
  documentIds: string[],
  comment?: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์อนุมัติเอกสาร",
    };
  }

  // Get documents that can be approved
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
      status: { in: [DocumentStatus.PENDING_REVIEW, DocumentStatus.NEED_INFO] },
    },
  });

  if (documents.length === 0) {
    return {
      success: false,
      error: "ไม่พบเอกสารที่สามารถอนุมัติได้",
    };
  }

  const validIds = documents.map((d) => d.id);

  await prisma.$transaction(async (tx) => {
    // Update documents
    await tx.document.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: DocumentStatus.READY_TO_EXPORT,
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
    });

    // Add comments if provided
    if (comment) {
      await tx.comment.createMany({
        data: validIds.map((docId) => ({
          documentId: docId,
          userId: session.id,
          content: comment,
          isInternal: false,
        })),
      });
    }

    // Log activity
    await tx.activityLog.createMany({
      data: validIds.map((docId) => ({
        documentId: docId,
        userId: session.id,
        action: "BULK_APPROVED",
        details: comment ? { comment } : undefined,
      })),
    });
  });

  revalidatePath("/documents");
  revalidatePath("/inbox");

  return {
    success: true,
    data: { count: validIds.length },
  };
}

export async function bulkReject(
  documentIds: string[],
  reason: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ปฏิเสธเอกสาร",
    };
  }

  if (!reason.trim()) {
    return {
      success: false,
      error: "กรุณาระบุเหตุผลในการปฏิเสธ",
    };
  }

  // Get documents that can be rejected
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
      status: { in: [DocumentStatus.PENDING_REVIEW, DocumentStatus.NEED_INFO] },
    },
  });

  if (documents.length === 0) {
    return {
      success: false,
      error: "ไม่พบเอกสารที่สามารถปฏิเสธได้",
    };
  }

  const validIds = documents.map((d) => d.id);

  await prisma.$transaction(async (tx) => {
    // Update documents
    await tx.document.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: DocumentStatus.REJECTED,
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
    });

    // Add rejection comments
    await tx.comment.createMany({
      data: validIds.map((docId) => ({
        documentId: docId,
        userId: session.id,
        content: `ปฏิเสธ: ${reason}`,
        isInternal: false,
      })),
    });

    // Log activity
    await tx.activityLog.createMany({
      data: validIds.map((docId) => ({
        documentId: docId,
        userId: session.id,
        action: "BULK_REJECTED",
        details: { reason },
      })),
    });
  });

  revalidatePath("/documents");
  revalidatePath("/inbox");

  return {
    success: true,
    data: { count: validIds.length },
  };
}

export async function bulkExport(
  documentIds: string[]
): Promise<ApiResponse<{ downloadUrl: string }>> {
  const session = await requireOrganization();

  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      submittedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { docDate: "asc" },
  });

  if (documents.length === 0) {
    return {
      success: false,
      error: "ไม่พบเอกสารที่เลือก",
    };
  }

  // Create Excel
  const workbook = XLSX.utils.book_new();
  
  const data = documents.map((doc) => ({
    "เลขที่เอกสาร": doc.docNumber,
    "วันที่": new Date(doc.docDate).toLocaleDateString("th-TH"),
    "ประเภท": doc.transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ",
    "ประเภทเอกสาร": doc.docType,
    "หมวดหมู่": doc.category?.name || "-",
    "ศูนย์ต้นทุน": doc.costCenter?.name || "-",
    "คู่ค้า": doc.contact?.name || "-",
    "รายละเอียด": doc.description || "-",
    "ยอดก่อน VAT": doc.subtotal.toNumber(),
    "VAT": doc.vatAmount.toNumber(),
    "หัก ณ ที่จ่าย": doc.whtAmount.toNumber(),
    "ยอดรวม": doc.totalAmount.toNumber(),
    "สถานะ": doc.status,
    "ผู้ส่ง": doc.submittedBy.name || doc.submittedBy.email,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "เอกสาร");
  
  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

  // Save export history
  await prisma.exportHistory.create({
    data: {
      organizationId: session.currentOrganization.id,
      exportType: "EXCEL_GENERIC",
      fileName: `bulk_export_${new Date().toISOString().split("T")[0]}.xlsx`,
      documentIds,
      documentCount: documents.length,
      exportedById: session.id,
    },
  });

  return {
    success: true,
    data: {
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`,
    },
  };
}

export async function bulkAssignCategory(
  documentIds: string[],
  categoryId: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Verify category belongs to organization
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!category) {
    return {
      success: false,
      error: "ไม่พบหมวดหมู่",
    };
  }

  const result = await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
    },
    data: { categoryId },
  });

  revalidatePath("/documents");

  return {
    success: true,
    data: { count: result.count },
  };
}

export async function bulkAssignCostCenter(
  documentIds: string[],
  costCenterId: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Verify cost center belongs to organization
  const costCenter = await prisma.costCenter.findFirst({
    where: {
      id: costCenterId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!costCenter) {
    return {
      success: false,
      error: "ไม่พบศูนย์ต้นทุน",
    };
  }

  const result = await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
    },
    data: { costCenterId },
  });

  revalidatePath("/documents");

  return {
    success: true,
    data: { count: result.count },
  };
}
