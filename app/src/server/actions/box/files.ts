"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { createAutoPaymentFromSlip, recalculateBoxPaymentStatus } from "../payment-helpers";
import crypto from "crypto";
import type { ApiResponse, DocType } from "@/types";
import { recalculateBoxChecklist } from "./checklist";
import { checkDuplicateByHash } from "../duplicate";

// ==================== Add File to Box ====================

export async function addFileToBox(
  boxId: string,
  formData: FormData
): Promise<ApiResponse<{ 
  duplicateWarning?: { boxId: string; boxNumber: string }; 
  isOverpaid?: boolean;
  overpaidAmount?: number;
}>> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const file = formData.get("file") as File | null;
  const docType = (formData.get("docType") as string) || "OTHER";
  const amount = formData.get("amount") as string | null;
  const vatAmount = formData.get("vatAmount") as string | null;

  if (!file || !(file instanceof File)) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  const supabase = createAdminClient();

  try {
    // Generate unique filename
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const fileName = `${session.currentOrganization.id}/${box.id}/${timestamp}-${randomStr}.${ext}`;

    // Calculate checksum
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = crypto
      .createHash("md5")
      .update(buffer)
      .digest("hex");

    // Check for duplicate file (Section 17)
    const duplicateCheck = await checkDuplicateByHash(buffer, session.currentOrganization.id);
    let duplicateWarning: { boxId: string; boxNumber: string } | undefined;
    
    if (duplicateCheck.isDuplicate && duplicateCheck.existingBoxId !== boxId) {
      // Mark current box as possible duplicate
      await prisma.box.update({
        where: { id: boxId },
        data: {
          possibleDuplicate: true,
          duplicateReason: `ไฟล์ซ้ำกับ ${duplicateCheck.existingBoxNumber}`,
        },
      });
      
      duplicateWarning = {
        boxId: duplicateCheck.existingBoxId!,
        boxNumber: duplicateCheck.existingBoxNumber!,
      };
    }

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: `อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Check if Document for this type already exists
    let document = await prisma.document.findFirst({
      where: {
        boxId: box.id,
        docType: docType as DocType,
      },
    });

    if (document) {
      // Add file to existing Document
      await prisma.documentFile.create({
        data: {
          documentId: document.id,
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          checksum,
        },
      });
    } else {
      // Create new Document with file
      document = await prisma.document.create({
        data: {
          boxId: box.id,
          docType: docType as DocType,
          files: {
            create: {
              fileName: file.name,
              fileUrl: urlData.publicUrl,
              fileSize: file.size,
              mimeType: file.type,
              checksum,
            },
          },
        },
      });
    }

    // Update box amount if provided (e.g., from tax invoice)
    if (amount && docType === "TAX_INVOICE") {
      const amountNum = parseFloat(amount);
      const vatAmountNum = vatAmount ? parseFloat(vatAmount) : 0;
      
      await prisma.box.update({
        where: { id: box.id },
        data: {
          totalAmount: amountNum,
          vatAmount: vatAmountNum,
        },
      });
    }

    // Auto-create payment record when payment slip is uploaded
    const isPaymentSlip = ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(docType);
    let paymentResult: { isOverpaid?: boolean; overpaidAmount?: number } = {};
    if (isPaymentSlip) {
      const slipAmountNum = amount ? parseFloat(amount) : 0;
      paymentResult = await createAutoPaymentFromSlip({
        boxId: box.id,
        amount: slipAmountNum,
        method: docType === "SLIP_TRANSFER" ? "TRANSFER" : "CHEQUE",
        documentId: document.id,
        reference: file.name,
        notes: slipAmountNum > 0 
          ? "บันทึกอัตโนมัติจากยอดในสลิป" 
          : "บันทึกอัตโนมัติจากการอัปโหลดสลิป",
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: box.id,
        userId: session.id,
        action: "FILE_ADDED",
        details: {
          fileName: file.name,
          docType,
        },
      },
    });

    // Recalculate checklist
    await recalculateBoxChecklist(box.id);

    revalidatePath(`/documents/${box.id}`);
    revalidatePath("/documents");

    let message = "เพิ่มเอกสารสำเร็จ";
    if (paymentResult.isOverpaid) {
      message = `เพิ่มเอกสารสำเร็จ (ชำระเกินยอด ฿${paymentResult.overpaidAmount?.toLocaleString()})`;
    }
    if (duplicateWarning) {
      message += ` (⚠️ อาจซ้ำกับ ${duplicateWarning.boxNumber})`;
    }

    return { 
      success: true, 
      message,
      data: {
        duplicateWarning,
        isOverpaid: paymentResult.isOverpaid,
        overpaidAmount: paymentResult.overpaidAmount,
      },
    };
  } catch (error) {
    console.error("Error adding file:", error);
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}

// ==================== Update File Doc Type ====================

export async function updateFileDocType(
  boxId: string,
  fileId: string,
  newDocType: DocType
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      document: {
        boxId: box.id,
      },
    },
    include: {
      document: true,
    },
  });

  if (!file) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  const oldDocType = file.document.docType;

  // If same type, no action needed
  if (oldDocType === newDocType) {
    return { success: true, message: "ประเภทเอกสารเหมือนเดิม" };
  }

  try {
    // Check if there's already a Document with the new type
    let targetDocument = await prisma.document.findFirst({
      where: {
        boxId: box.id,
        docType: newDocType,
      },
    });

    if (targetDocument) {
      // Move file to existing document
      await prisma.documentFile.update({
        where: { id: fileId },
        data: { documentId: targetDocument.id },
      });
    } else {
      // Create new document with new type and move file
      targetDocument = await prisma.document.create({
        data: {
          boxId: box.id,
          docType: newDocType,
        },
      });
      await prisma.documentFile.update({
        where: { id: fileId },
        data: { documentId: targetDocument.id },
      });
    }

    // Check if old document has any files left
    const remainingFiles = await prisma.documentFile.count({
      where: { documentId: file.documentId },
    });

    // If old document is empty, delete it
    if (remainingFiles === 0) {
      await prisma.document.delete({
        where: { id: file.documentId },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: box.id,
        userId: session.id,
        action: "FILE_TYPE_CHANGED",
        details: {
          fileName: file.fileName,
          oldDocType,
          newDocType,
        },
      },
    });

    // Recalculate checklist
    await recalculateBoxChecklist(box.id);

    revalidatePath(`/documents/${box.id}`);
    revalidatePath("/documents");

    return { success: true, message: "เปลี่ยนประเภทเอกสารสำเร็จ" };
  } catch (error) {
    console.error("Error updating file doc type:", error);
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}

// ==================== Delete File ====================

export async function deleteBoxFile(
  boxId: string,
  fileId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      document: {
        boxId: box.id,
      },
    },
    include: {
      document: true,
    },
  });

  if (!file) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  const supabase = createAdminClient();

  try {
    // Delete from storage
    if (file.fileUrl) {
      const urlParts = file.fileUrl.split("/documents/");
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage.from("documents").remove([storagePath]);
      }
    }

    // Delete file record
    await prisma.documentFile.delete({
      where: { id: fileId },
    });

    // Check if Document has any files left
    const remainingFiles = await prisma.documentFile.count({
      where: { documentId: file.documentId },
    });

    // If no files left, delete the Document and related payments
    if (remainingFiles === 0) {
      // Check if this document has linked payments (e.g., slip documents)
      const linkedPayments = await prisma.payment.findMany({
        where: { documentId: file.documentId },
      });

      if (linkedPayments.length > 0) {
        // Delete linked payments
        await prisma.payment.deleteMany({
          where: { documentId: file.documentId },
        });
        console.log(`[deleteBoxFile] Deleted ${linkedPayments.length} linked payment(s) for document ${file.documentId}`);

        // Recalculate payment status after deleting payments
        await recalculateBoxPaymentStatus(box.id);
      }

      // Delete the document
      await prisma.document.delete({
        where: { id: file.documentId },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: box.id,
        userId: session.id,
        action: "FILE_DELETED",
        details: {
          fileName: file.fileName,
          docType: file.document.docType,
        },
      },
    });

    // Recalculate checklist
    await recalculateBoxChecklist(box.id);

    revalidatePath(`/documents/${box.id}`);
    revalidatePath("/documents");

    return { success: true, message: "ลบไฟล์สำเร็จ" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}
