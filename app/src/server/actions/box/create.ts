"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAutoPaymentFromSlip } from "../payment-helpers";
import crypto from "crypto";
import type { ApiResponse, DocType } from "@/types";
import { DEFAULT_WHT_RATE_PERCENT, DEFAULT_WHT_RATE, DEFAULT_AMOUNT, DEFAULT_DOC_TYPE, CACHE_CONTROL_ONE_HOUR, VAT_RATE } from "@/lib/constants/values";
import { BoxStatus, DocStatus, ExpenseType } from "@prisma/client";

// Import recalculateBoxChecklist - will be created in checklist.ts
// For now, define locally to avoid circular dependency
async function recalculateBoxChecklistLocal(boxId: string): Promise<void> {
  const { getAutoChecklistUpdates, determineDocStatus } = await import("@/lib/checklist");
  const { PaymentStatus } = await import("@prisma/client");
  
  const box = await prisma.box.findFirst({
    where: { id: boxId },
    include: { documents: true },
  });

  if (!box) return;

  const uploadedDocTypes = new Set(box.documents.map((d) => d.docType));

  const checklist = {
    isPaid: box.paymentStatus === PaymentStatus.PAID,
    hasPaymentProof: false,
    hasTaxInvoice: false,
    hasInvoice: false,
    whtIssued: false,
    whtSent: box.whtSent,
    whtReceived: false,
  };

  const autoUpdates = getAutoChecklistUpdates(uploadedDocTypes);
  Object.assign(checklist, autoUpdates);

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
    data: { docStatus },
  });
}

// ==================== Box Number Generation ====================

export async function generateBoxNumber(orgId: string, type: "EXPENSE" | "INCOME" | "ADJUSTMENT"): Promise<string> {
  const prefix = type === "EXPENSE" ? "EXP" : type === "INCOME" ? "INC" : "ADJ";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  
  const count = await prisma.box.count({
    where: {
      organizationId: orgId,
      boxType: type,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}-${sequence}`;
}

// ==================== Create Box ====================

export async function createBox(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();
  
  // Parse form data
  const boxType = (formData.get("boxType") as string) || "EXPENSE";
  const expenseType = formData.get("expenseType") as string || undefined;
  const boxDateStr = formData.get("boxDate") as string;
  const dueDateStr = formData.get("dueDate") as string || undefined;
  const totalAmountStr = formData.get("totalAmount") as string;
  const vatAmountStr = formData.get("vatAmount") as string || DEFAULT_AMOUNT;
  const whtAmountStr = formData.get("whtAmount") as string || DEFAULT_AMOUNT;
  const vatRateStr = formData.get("vatRate") as string || undefined;
  const whtRateStr = formData.get("whtRate") as string || undefined;
  
  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : 0;
  const vatAmount = parseFloat(vatAmountStr);
  const whtAmount = parseFloat(whtAmountStr);
  
  // Multi-payment support
  const isMultiPayment = formData.get("isMultiPayment") === "true";
  const slipAmountStr = formData.get("slipAmount") as string;
  const slipAmount = slipAmountStr ? parseFloat(slipAmountStr) : null;
  
  const boxNumber = await generateBoxNumber(
    session.currentOrganization.id,
    boxType as "EXPENSE" | "INCOME" | "ADJUSTMENT"
  );

  const box = await prisma.box.create({
    data: {
      organizationId: session.currentOrganization.id,
      boxNumber,
      boxType: boxType as "EXPENSE" | "INCOME" | "ADJUSTMENT",
      expenseType: expenseType ? expenseType as ExpenseType : null,
      boxDate: boxDateStr ? new Date(boxDateStr) : new Date(),
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      totalAmount,
      vatAmount,
      whtAmount,
      vatRate: vatRateStr ? parseFloat(vatRateStr) : null,
      whtRate: whtRateStr ? parseFloat(whtRateStr) : null,
      isVatInclusive: formData.get("isVatInclusive") === "true",
      hasVat: formData.get("hasVat") === "true",
      hasWht: formData.get("hasWht") === "true",
      foreignCurrency: formData.get("foreignCurrency") as string || null,
      foreignAmount: formData.get("foreignAmount") ? parseFloat(formData.get("foreignAmount") as string) : null,
      exchangeRate: formData.get("exchangeRate") ? parseFloat(formData.get("exchangeRate") as string) : null,
      noReceiptReason: formData.get("noReceiptReason") as string || null,
      title: formData.get("title") as string || null,
      description: formData.get("description") as string || null,
      notes: formData.get("notes") as string || null,
      externalRef: formData.get("externalRef") as string || null,
      contactId: formData.get("contactId") as string || null,
      categoryId: formData.get("categoryId") as string || null,
      costCenterId: formData.get("costCenterId") as string || null,
      linkedBoxId: formData.get("linkedBoxId") as string || null,
      createdById: session.id,
      status: BoxStatus.DRAFT,
      docStatus: DocStatus.INCOMPLETE,
    },
  });

  // Handle file uploads
  await handleFileUploads(formData, box.id, session, isMultiPayment, slipAmount);

  // Auto-create WHT Tracking when hasWht is true
  if (formData.get("hasWht") === "true") {
    const trackingType = boxType === "EXPENSE" ? "OUTGOING" : "INCOMING";
    const whtAmountCalc = whtAmount || totalAmount * 0.03; // Default 3%
    
    await prisma.whtTracking.create({
      data: {
        boxId: box.id,
        type: trackingType,
        amount: whtAmountCalc,
        rate: whtRateStr ? parseFloat(whtRateStr) : 3,
        contactId: formData.get("contactId") as string || null,
        status: "PENDING",
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: box.id,
      userId: session.id,
      action: "CREATED",
      details: { boxNumber },
    },
  });

  // Update contact lastUsedAt (Section 9 - Learning)
  const contactId = formData.get("contactId") as string;
  if (contactId) {
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastUsedAt: new Date() },
    }).catch(() => {}); // Ignore if contact not found
  }

  // Create BoxPayer records (who pays - supports multiple payers)
  const payersJson = formData.get("payers") as string;
  if (payersJson) {
    try {
      const payers = JSON.parse(payersJson) as {
        id: string;
        payerType: "COMPANY" | "PETTY_CASH" | "MEMBER";
        memberId?: string;
        amount: number;
      }[];

      for (const payer of payers) {
        await prisma.boxPayer.create({
          data: {
            boxId: box.id,
            payerType: payer.payerType,
            memberId: payer.payerType === "MEMBER" ? payer.memberId : null,
            amount: payer.amount,
            reimbursementStatus: payer.payerType === "MEMBER" ? "PENDING" : "NONE",
          },
        });
      }
    } catch {
      // If payers parsing fails, create default COMPANY payer
      await prisma.boxPayer.create({
        data: {
          boxId: box.id,
          payerType: "COMPANY",
          amount: totalAmount,
          reimbursementStatus: "NONE",
        },
      });
    }
  } else {
    // No payers specified - default to COMPANY
    await prisma.boxPayer.create({
      data: {
        boxId: box.id,
        payerType: "COMPANY",
        amount: totalAmount,
        reimbursementStatus: "NONE",
      },
    });
  }

  revalidatePath("/documents");
  revalidatePath("/wht-tracking");
  
  return {
    success: true,
    data: { id: box.id },
  };
}

// ==================== File Upload Handler ====================

export async function handleFileUploads(
  formData: FormData,
  boxId: string,
  session: { currentOrganization: { id: string }; id: string },
  isMultiPayment = false,
  slipAmount: number | null = null
) {
  // Support both old format (files[], fileTypes[]) and new format (file_0, file_1, ...)
  let files: File[] = formData.getAll("files") as File[];
  let fileTypes: string[] = formData.getAll("fileTypes") as string[];

  // Check for new format (file_0, file_1, ...)
  if (files.length === 0) {
    let index = 0;
    while (true) {
      const file = formData.get(`file_${index}`);
      // In Server Actions, files might be Blob-like objects, not File instances
      if (!file || typeof file === "string" || !(file as Blob).arrayBuffer) break;
      files.push(file as File);
      const fileType = formData.get(`fileType_${index}`) as string || DEFAULT_DOC_TYPE;
      fileTypes.push(fileType);
      index++;
    }
  }

  if (files.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("[handleFileUploads] No files found in formData");
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[handleFileUploads] Processing ${files.length} files for box ${boxId}`);
  }

  const supabase = await createClient();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docType = (fileTypes[i] || "OTHER") as DocType;
    
    // Get file name - handle both File and Blob-like objects
    const originalFileName = file.name || `file_${i}`;
    if (process.env.NODE_ENV === "development") {
      console.log(`[handleFileUploads] Processing file ${i}: ${originalFileName}, type: ${file.type}, size: ${file.size}`);
    }

    try {
      // Generate unique filename
      const ext = originalFileName.split(".").pop() || "bin";
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString("hex");
      const fileName = `${session.currentOrganization.id}/${boxId}/${timestamp}-${randomStr}.${ext}`;

      // Calculate checksum
      const arrayBuffer = await file.arrayBuffer();
      const checksum = crypto
        .createHash("md5")
        .update(Buffer.from(arrayBuffer))
        .digest("hex");

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("[handleFileUploads] Supabase upload error:", uploadError);
        continue;
      }
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[handleFileUploads] File uploaded to storage: ${fileName}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Check if Document for this type already exists
      let document = await prisma.document.findFirst({
        where: {
          boxId,
          docType,
        },
      });

      // Create Document if not exists
      if (!document) {
        document = await prisma.document.create({
          data: {
            boxId,
            docType,
          },
        });
      }

      // Create DocumentFile
      const docFile = await prisma.documentFile.create({
        data: {
          documentId: document.id,
          fileName: originalFileName,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          checksum,
          pageOrder: i,
        },
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[handleFileUploads] Created DocumentFile: ${docFile.id} for document ${document.id}`);
      }

      // Auto-create payment record when payment slip is uploaded
      const isPaymentSlip = ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(docType);
      if (isPaymentSlip) {
        await createAutoPaymentFromSlip({
          boxId,
          amount: slipAmount || 0,
          method: docType === "SLIP_TRANSFER" ? "TRANSFER" : "CHEQUE",
          documentId: document.id,
          reference: originalFileName,
          isMultiPayment,
          slipAmount: slipAmount ?? undefined,
        });
      }
    } catch (error) {
      console.error("[handleFileUploads] Error uploading file:", error);
    }
  }

  // Recalculate box checklist
  await recalculateBoxChecklistLocal(boxId);
}
