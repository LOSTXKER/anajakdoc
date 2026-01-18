"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse, CreateSubDocumentInput, UpdateSubDocumentInput } from "@/types";
import { revalidatePath } from "next/cache";
import type { SubDocType } from ".prisma/client";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { recalculateDocumentChecklist } from "./document";

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

// Create SubDocument with file upload (for direct upload from view mode)
export async function createSubDocumentWithFile(
  formData: FormData
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  const documentId = formData.get("documentId") as string;
  const docType = formData.get("docType") as SubDocType;
  const file = formData.get("file") as File;

  if (!documentId || !docType || !file) {
    return { success: false, error: "ข้อมูลไม่ครบ" };
  }

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสารหลัก" };
  }

  try {
    // Upload file to Supabase
    const supabase = await createClient();
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const filePath = `organizations/${session.currentOrganization.id}/documents/${documentId}/${timestamp}-${randomStr}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const checksum = crypto
      .createHash("md5")
      .update(Buffer.from(arrayBuffer))
      .digest("hex");

    // Convert File to ArrayBuffer for upload
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: `อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Create SubDocument with file
    const subDocument = await prisma.subDocument.create({
      data: {
        documentId,
        docType,
        docDate: new Date(),
        files: {
          create: {
            fileName: file.name,
            fileUrl: urlData.publicUrl,
            fileSize: file.size,
            mimeType: file.type,
            checksum,
            pageOrder: 0,
            isPrimary: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        documentId,
        userId: session.id,
        action: "subdocument_added",
        details: {
          subDocumentId: subDocument.id,
          docType,
          fileName: file.name,
        },
      },
    });

    // Recalculate checklist
    await recalculateDocumentChecklist(documentId);

    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return { success: true, data: { id: subDocument.id } };
  } catch (error) {
    console.error("Error creating subdocument:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" 
    };
  }
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

// Update SubDocument slot status (for "ไม่มี" / "มีแล้ว")
export async function updateSubDocumentStatus(
  documentId: string,
  docType: SubDocType,
  status: "pending" | "not_applicable",
  reason?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      subDocuments: {
        where: { docType },
      },
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  try {
    if (status === "not_applicable") {
      // Create or update SubDocument with NOT_APPLICABLE status
      if (document.subDocuments.length > 0) {
        // Update existing
        await prisma.subDocument.updateMany({
          where: { documentId, docType },
          data: {
            slotStatus: "NOT_APPLICABLE",
            naReason: reason || null,
          },
        });
      } else {
        // Create placeholder
        await prisma.subDocument.create({
          data: {
            documentId,
            docType,
            slotStatus: "NOT_APPLICABLE",
            naReason: reason || null,
          },
        });
      }
    } else {
      // Revert to PENDING
      await prisma.subDocument.updateMany({
        where: { documentId, docType },
        data: {
          slotStatus: "PENDING",
          naReason: null,
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        documentId,
        userId: session.id,
        action: status === "not_applicable" ? "slot_marked_na" : "slot_reactivated",
        details: {
          docType,
          reason: reason || null,
        },
      },
    });

    // Recalculate completion
    await recalculateDocumentChecklist(documentId);

    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return { success: true, message: "อัปเดทสถานะเรียบร้อย" };
  } catch (error) {
    console.error("Error updating slot status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
