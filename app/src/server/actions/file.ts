"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export type DuplicateWarning = {
  type: "exact" | "soft";
  documentId: string;
  docNumber: string;
  message: string;
};

// Check for duplicate files by checksum (client-side hash)
export async function checkDuplicateFile(
  checksum: string
): Promise<DuplicateWarning | null> {
  const session = await requireOrganization();

  const existingFile = await prisma.documentFile.findFirst({
    where: {
      document: { organizationId: session.currentOrganization.id },
      checksum,
    },
    include: {
      document: {
        select: { id: true, docNumber: true },
      },
    },
  });

  if (existingFile) {
    return {
      type: "exact",
      documentId: existingFile.document.id,
      docNumber: existingFile.document.docNumber,
      message: `ไฟล์นี้อาจซ้ำกับเอกสาร ${existingFile.document.docNumber}`,
    };
  }

  return null;
}

// Check for soft duplicate (same amount + contact + date)
export async function checkSoftDuplicate(
  totalAmount: number,
  contactId: string | null,
  docDate: Date,
  excludeDocId?: string
): Promise<DuplicateWarning | null> {
  const session = await requireOrganization();

  // Check within 3 days of the doc date
  const dateStart = new Date(docDate);
  dateStart.setDate(dateStart.getDate() - 3);
  const dateEnd = new Date(docDate);
  dateEnd.setDate(dateEnd.getDate() + 3);

  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
    totalAmount,
    docDate: {
      gte: dateStart,
      lte: dateEnd,
    },
  };

  if (contactId) {
    where.contactId = contactId;
  }

  if (excludeDocId) {
    where.id = { not: excludeDocId };
  }

  const existingDoc = await prisma.document.findFirst({
    where,
    select: { id: true, docNumber: true, docDate: true },
  });

  if (existingDoc) {
    return {
      type: "soft",
      documentId: existingDoc.id,
      docNumber: existingDoc.docNumber,
      message: `พบเอกสาร ${existingDoc.docNumber} ที่มียอดและวันที่ใกล้เคียงกัน`,
    };
  }

  return null;
}

export async function uploadDocumentFiles(
  documentId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; fileIds?: string[] }> {
  const session = await requireOrganization();

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  const supabase = await createClient();
  const files = formData.getAll("files") as File[];
  const fileIds: string[] = [];

  // Get current max page order
  const lastFile = await prisma.documentFile.findFirst({
    where: { documentId },
    orderBy: { pageOrder: "desc" },
  });
  let pageOrder = (lastFile?.pageOrder ?? -1) + 1;

  for (const file of files) {
    try {
      // Generate unique filename
      const ext = file.name.split(".").pop();
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString("hex");
      const fileName = `${session.currentOrganization.id}/${documentId}/${timestamp}-${randomStr}.${ext}`;

      // Calculate checksum for duplicate detection
      const arrayBuffer = await file.arrayBuffer();
      const checksum = crypto
        .createHash("md5")
        .update(Buffer.from(arrayBuffer))
        .digest("hex");

      // Check for duplicate
      const existingFile = await prisma.documentFile.findFirst({
        where: {
          document: { organizationId: session.currentOrganization.id },
          checksum,
        },
        include: { document: true },
      });

      if (existingFile) {
        console.warn(
          `Duplicate file detected: ${file.name} matches ${existingFile.fileName} in document ${existingFile.document.docNumber}`
        );
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Create database record
      const documentFile = await prisma.documentFile.create({
        data: {
          documentId,
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          checksum,
          pageOrder,
          isPrimary: pageOrder === 0,
        },
      });

      fileIds.push(documentFile.id);
      pageOrder++;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
    fileIds,
  };
}

export async function deleteDocumentFile(
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireOrganization();

  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      document: { organizationId: session.currentOrganization.id },
    },
  });

  if (!file) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  // Delete from storage
  const supabase = await createClient();
  const filePath = file.fileUrl.split("/documents/")[1];
  
  if (filePath) {
    await supabase.storage.from("documents").remove([filePath]);
  }

  // Delete from database
  await prisma.documentFile.delete({
    where: { id: fileId },
  });

  revalidatePath(`/documents/${file.documentId}`);

  return { success: true };
}

export async function reorderDocumentFiles(
  documentId: string,
  fileIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await requireOrganization();

  // Verify document belongs to organization
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  // Update page order
  await Promise.all(
    fileIds.map((fileId, index) =>
      prisma.documentFile.update({
        where: { id: fileId },
        data: {
          pageOrder: index,
          isPrimary: index === 0,
        },
      })
    )
  );

  revalidatePath(`/documents/${documentId}`);

  return { success: true };
}
