"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ai-classify";
import type { ApiResponse } from "@/types";

export interface AIReadResult {
  // Aggregated data from all documents
  totalAmount?: number;
  vatAmount?: number;
  contactName?: string;
  taxId?: string;
  documentDate?: string;
  description?: string;
  // Individual file results
  files: {
    fileId: string;
    fileName: string;
    docType?: string;
    extracted?: ExtractedDocumentData;
    error?: string;
  }[];
}

/**
 * Read all documents in a box using AI and extract data
 */
export async function readBoxDocuments(boxId: string): Promise<ApiResponse<AIReadResult>> {
  const session = await requireOrganization();
  
  // Get box with all files
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      documents: {
        include: {
          files: true,
        },
      },
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  // Get all files from documents
  const allFiles = box.documents.flatMap(doc => 
    doc.files.map(f => ({
      ...f,
      docType: doc.docType,
    }))
  );

  if (allFiles.length === 0) {
    return {
      success: false,
      error: "ไม่มีไฟล์ในกล่องนี้",
    };
  }

  const results: AIReadResult = {
    files: [],
  };

  // Process each file
  for (const file of allFiles) {
    try {
      // Fetch file and convert to base64
      const response = await fetch(file.fileUrl);
      if (!response.ok) {
        results.files.push({
          fileId: file.id,
          fileName: file.fileName,
          error: "ไม่สามารถดึงไฟล์ได้",
        });
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Call AI to extract data
      const extractResult = await extractDocumentData(base64, file.mimeType);

      if (extractResult.success && extractResult.data) {
        results.files.push({
          fileId: file.id,
          fileName: file.fileName,
          docType: extractResult.data.type,
          extracted: extractResult.data,
        });

        // Aggregate data - prefer tax invoice data over slip data
        const data = extractResult.data;
        
        // Amount - prefer from tax invoice or invoice
        if (data.amount && ["TAX_INVOICE", "INVOICE"].includes(data.type)) {
          results.totalAmount = data.amount;
          results.vatAmount = data.vatAmount;
        } else if (data.amount && !results.totalAmount) {
          results.totalAmount = data.amount;
        }

        // Contact name & tax ID
        if (data.contactName && !results.contactName) {
          results.contactName = data.contactName;
        }
        if (data.taxId && !results.taxId) {
          results.taxId = data.taxId;
        }

        // Date
        if (data.documentDate && !results.documentDate) {
          results.documentDate = data.documentDate;
        }

        // Description
        if (data.description && !results.description) {
          results.description = data.description;
        }
      } else {
        results.files.push({
          fileId: file.id,
          fileName: file.fileName,
          error: extractResult.error || "วิเคราะห์ไม่สำเร็จ",
        });
      }
    } catch (error) {
      results.files.push({
        fileId: file.id,
        fileName: file.fileName,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      });
    }
  }

  return {
    success: true,
    data: results,
  };
}
