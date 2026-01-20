"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import type { ApiResponse } from "@/types";
import { BoxStatus } from "@prisma/client";

export async function bulkApproveBoxes(
  boxIds: string[],
  comment?: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์อนุมัติกล่องเอกสาร",
    };
  }

  // Get boxes that can be approved
  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
      status: { in: [BoxStatus.PENDING_REVIEW, BoxStatus.NEED_INFO] },
    },
  });

  if (boxes.length === 0) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารที่สามารถอนุมัติได้",
    };
  }

  const validIds = boxes.map((b) => b.id);

  await prisma.$transaction(async (tx) => {
    // Update boxes
    await tx.box.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: BoxStatus.APPROVED,
      },
    });

    // Add comments if provided
    if (comment) {
      await tx.comment.createMany({
        data: validIds.map((boxId) => ({
          boxId,
          userId: session.id,
          content: comment,
          isInternal: false,
        })),
      });
    }

    // Log activity
    await tx.activityLog.createMany({
      data: validIds.map((boxId) => ({
        boxId,
        userId: session.id,
        action: "BULK_APPROVED",
        details: comment ? { comment } : undefined,
      })),
    });
  });

  revalidatePath("/documents");

  return {
    success: true,
    data: { count: validIds.length },
  };
}

export async function bulkRejectBoxes(
  boxIds: string[],
  reason: string
): Promise<ApiResponse<{ count: number }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ปฏิเสธกล่องเอกสาร",
    };
  }

  if (!reason.trim()) {
    return {
      success: false,
      error: "กรุณาระบุเหตุผลในการปฏิเสธ",
    };
  }

  // Get boxes that can be rejected
  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
      status: { in: [BoxStatus.PENDING_REVIEW, BoxStatus.NEED_INFO] },
    },
  });

  if (boxes.length === 0) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารที่สามารถปฏิเสธได้",
    };
  }

  const validIds = boxes.map((b) => b.id);

  await prisma.$transaction(async (tx) => {
    // Update boxes
    await tx.box.updateMany({
      where: { id: { in: validIds } },
      data: {
        status: BoxStatus.CANCELLED,
      },
    });

    // Add rejection comments
    await tx.comment.createMany({
      data: validIds.map((boxId) => ({
        boxId,
        userId: session.id,
        content: `ปฏิเสธ: ${reason}`,
        isInternal: false,
      })),
    });

    // Log activity
    await tx.activityLog.createMany({
      data: validIds.map((boxId) => ({
        boxId,
        userId: session.id,
        action: "BULK_REJECTED",
        details: { reason },
      })),
    });
  });

  revalidatePath("/documents");

  return {
    success: true,
    data: { count: validIds.length },
  };
}

export async function bulkExportBoxes(
  boxIds: string[]
): Promise<ApiResponse<{ downloadUrl: string }>> {
  const session = await requireOrganization();

  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      createdBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { boxDate: "asc" },
  });

  if (boxes.length === 0) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารที่เลือก",
    };
  }

  // Create Excel
  const workbook = XLSX.utils.book_new();
  
  const data = boxes.map((box) => ({
    "เลขที่กล่อง": box.boxNumber,
    "วันที่": new Date(box.boxDate).toLocaleDateString("th-TH"),
    "ประเภท": box.boxType === "EXPENSE" ? "รายจ่าย" : box.boxType === "INCOME" ? "รายรับ" : "ปรับปรุง",
    "หมวดหมู่": box.category?.name || "-",
    "ศูนย์ต้นทุน": box.costCenter?.name || "-",
    "คู่ค้า": box.contact?.name || "-",
    "รายละเอียด": box.title || "-",
    "ยอดรวม": Number(box.totalAmount),
    "VAT": Number(box.vatAmount),
    "หัก ณ ที่จ่าย": Number(box.whtAmount),
    "สถานะ": box.status,
    "สถานะเอกสาร": box.docStatus,
    "สถานะชำระ": box.paymentStatus,
    "ผู้สร้าง": box.createdBy.name || box.createdBy.email,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "กล่องเอกสาร");
  
  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

  // Save export history
  await prisma.exportHistory.create({
    data: {
      organizationId: session.currentOrganization.id,
      exportType: "EXCEL_GENERIC",
      fileName: `bulk_export_${new Date().toISOString().split("T")[0]}.xlsx`,
      boxIds,
      boxCount: boxes.length,
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
  boxIds: string[],
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

  const result = await prisma.box.updateMany({
    where: {
      id: { in: boxIds },
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
  boxIds: string[],
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

  const result = await prisma.box.updateMany({
    where: {
      id: { in: boxIds },
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
