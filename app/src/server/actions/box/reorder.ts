"use server";

/**
 * Document/File Reorder Actions
 * 
 * Features:
 * - Reorder documents within a box
 * - Reorder files within a document
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// ============================================
// REORDER DOCUMENTS IN BOX
// ============================================

export async function reorderDocuments(
  boxId: string,
  documentIds: string[]
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      documents: { select: { id: true } },
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  // Verify all document IDs belong to this box
  const existingIds = new Set(box.documents.map((d) => d.id));
  for (const docId of documentIds) {
    if (!existingIds.has(docId)) {
      return { success: false, error: "เอกสารไม่ถูกต้อง" };
    }
  }

  // Update order for each document
  await prisma.$transaction(
    documentIds.map((docId, index) =>
      prisma.document.update({
        where: { id: docId },
        data: { pageOrder: index },
      })
    )
  );

  revalidatePath(`/documents/${boxId}`);
  return { success: true, data: undefined };
}

// ============================================
// REORDER FILES IN DOCUMENT
// ============================================

export async function reorderFiles(
  documentId: string,
  fileIds: string[]
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      box: {
        organizationId: session.currentOrganization.id,
      },
    },
    include: {
      files: { select: { id: true } },
      box: { select: { id: true } },
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  // Verify all file IDs belong to this document
  const existingIds = new Set(document.files.map((f) => f.id));
  for (const fileId of fileIds) {
    if (!existingIds.has(fileId)) {
      return { success: false, error: "ไฟล์ไม่ถูกต้อง" };
    }
  }

  // Update page order for each file
  await prisma.$transaction(
    fileIds.map((fileId, index) =>
      prisma.documentFile.update({
        where: { id: fileId },
        data: { pageOrder: index },
      })
    )
  );

  revalidatePath(`/documents/${document.box.id}`);
  return { success: true, data: undefined };
}
