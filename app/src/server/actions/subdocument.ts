"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse, CreateSubDocumentInput, UpdateSubDocumentInput } from "@/types";
import { revalidatePath } from "next/cache";
import type { SubDocType } from ".prisma/client";

// Create SubDocument
export async function createSubDocument(
  input: CreateSubDocumentInput
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

  const subDocument = await prisma.subDocument.create({
    data: {
      documentId: input.documentId,
      docType: input.docType,
      docNumber: input.docNumber,
      docDate: input.docDate,
      amount: input.amount,
      vatAmount: input.vatAmount,
      notes: input.notes,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: input.documentId,
      userId: session.id,
      action: "subdocument_added",
      details: {
        subDocumentId: subDocument.id,
        docType: input.docType,
      },
    },
  });

  revalidatePath(`/documents/${input.documentId}`);
  revalidatePath("/documents");

  return { success: true, data: { id: subDocument.id } };
}

// Update SubDocument
export async function updateSubDocument(
  subDocumentId: string,
  input: UpdateSubDocumentInput
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify sub-document belongs to organization
  const subDocument = await prisma.subDocument.findFirst({
    where: {
      id: subDocumentId,
      document: {
        organizationId: session.currentOrganization.id,
      },
    },
    include: {
      document: true,
    },
  });

  if (!subDocument) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  await prisma.subDocument.update({
    where: { id: subDocumentId },
    data: {
      docType: input.docType,
      docNumber: input.docNumber,
      docDate: input.docDate,
      amount: input.amount,
      vatAmount: input.vatAmount,
      notes: input.notes,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: subDocument.documentId,
      userId: session.id,
      action: "subdocument_updated",
      details: {
        subDocumentId,
        changes: input,
      },
    },
  });

  revalidatePath(`/documents/${subDocument.documentId}`);

  return { success: true, message: "อัปเดตเอกสารเรียบร้อย" };
}

// Delete SubDocument
export async function deleteSubDocument(
  subDocumentId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify sub-document belongs to organization
  const subDocument = await prisma.subDocument.findFirst({
    where: {
      id: subDocumentId,
      document: {
        organizationId: session.currentOrganization.id,
      },
    },
    include: {
      document: true,
      files: true,
    },
  });

  if (!subDocument) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  // Delete sub-document (files will be cascade deleted)
  await prisma.subDocument.delete({
    where: { id: subDocumentId },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: subDocument.documentId,
      userId: session.id,
      action: "subdocument_deleted",
      details: {
        subDocumentId,
        docType: subDocument.docType,
      },
    },
  });

  revalidatePath(`/documents/${subDocument.documentId}`);

  return { success: true, message: "ลบเอกสารเรียบร้อย" };
}

// Get SubDocuments for a Document
export async function getSubDocuments(documentId: string) {
  const session = await requireOrganization();

  const subDocuments = await prisma.subDocument.findMany({
    where: {
      documentId,
      document: {
        organizationId: session.currentOrganization.id,
      },
    },
    include: {
      files: {
        orderBy: { pageOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return subDocuments;
}

// Add file to SubDocument
export async function addSubDocumentFile(
  subDocumentId: string,
  fileData: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    checksum?: string;
    pageOrder?: number;
    isPrimary?: boolean;
  }
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  // Verify sub-document belongs to organization
  const subDocument = await prisma.subDocument.findFirst({
    where: {
      id: subDocumentId,
      document: {
        organizationId: session.currentOrganization.id,
      },
    },
    include: {
      document: true,
      files: true,
    },
  });

  if (!subDocument) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  // Determine page order
  const pageOrder = fileData.pageOrder ?? subDocument.files.length;
  const isPrimary = fileData.isPrimary ?? subDocument.files.length === 0;

  const file = await prisma.subDocumentFile.create({
    data: {
      subDocumentId,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      checksum: fileData.checksum,
      pageOrder,
      isPrimary,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: subDocument.documentId,
      userId: session.id,
      action: "file_uploaded",
      details: {
        subDocumentId,
        fileId: file.id,
        fileName: fileData.fileName,
      },
    },
  });

  revalidatePath(`/documents/${subDocument.documentId}`);

  return { success: true, data: { id: file.id } };
}

// Delete SubDocument file
export async function deleteSubDocumentFile(
  fileId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify file belongs to organization
  const file = await prisma.subDocumentFile.findFirst({
    where: {
      id: fileId,
      subDocument: {
        document: {
          organizationId: session.currentOrganization.id,
        },
      },
    },
    include: {
      subDocument: {
        include: {
          document: true,
        },
      },
    },
  });

  if (!file) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  await prisma.subDocumentFile.delete({
    where: { id: fileId },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: file.subDocument.documentId,
      userId: session.id,
      action: "file_deleted",
      details: {
        subDocumentId: file.subDocumentId,
        fileId,
        fileName: file.fileName,
      },
    },
  });

  revalidatePath(`/documents/${file.subDocument.documentId}`);

  return { success: true, message: "ลบไฟล์เรียบร้อย" };
}

// Get SubDocType labels
export function getSubDocTypeLabel(docType: SubDocType): string {
  const labels: Record<SubDocType, string> = {
    SLIP: "สลิปโอนเงิน",
    TAX_INVOICE: "ใบกำกับภาษี",
    INVOICE: "ใบแจ้งหนี้",
    RECEIPT: "ใบเสร็จรับเงิน",
    WHT_CERT_SENT: "หนังสือหัก ณ ที่จ่าย (ออก)",
    CONTRACT: "สัญญา/ใบสั่งซื้อ",
    QUOTATION: "ใบเสนอราคา",
    WHT_CERT_RECEIVED: "หนังสือหัก ณ ที่จ่าย (รับ)",
    OTHER: "อื่นๆ",
  };
  return labels[docType] || docType;
}
