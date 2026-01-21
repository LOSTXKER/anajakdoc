"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

// ==================== Check Duplicate by File Hash (Section 17) ====================

export async function checkDuplicateByHash(
  fileBuffer: Buffer,
  organizationId: string
): Promise<{
  isDuplicate: boolean;
  existingBoxId?: string;
  existingBoxNumber?: string;
  matchType: "exact" | null;
}> {
  // Calculate MD5 hash
  const checksum = crypto.createHash("md5").update(fileBuffer).digest("hex");
  
  // Check if this hash exists
  const existingFile = await prisma.documentFile.findFirst({
    where: {
      checksum,
      document: {
        box: { organizationId },
      },
    },
    include: {
      document: {
        include: {
          box: {
            select: { id: true, boxNumber: true, status: true },
          },
        },
      },
    },
  });

  if (existingFile && existingFile.document.box.status !== "CANCELLED") {
    return {
      isDuplicate: true,
      existingBoxId: existingFile.document.box.id,
      existingBoxNumber: existingFile.document.box.boxNumber,
      matchType: "exact",
    };
  }

  return { isDuplicate: false, matchType: null };
}

// ==================== Check Duplicate by Amount+Date+Vendor (Section 17) ====================

export async function checkDuplicateByHeuristic(
  organizationId: string,
  amount: number,
  date: Date,
  contactId?: string
): Promise<{
  isDuplicate: boolean;
  existingBoxes: Array<{ id: string; boxNumber: string; similarity: number }>;
  matchType: "similar" | null;
}> {
  // Define tolerance
  const amountTolerance = 0.01; // 1% tolerance
  const dateTolerance = 1; // Same day
  
  const minAmount = amount * (1 - amountTolerance);
  const maxAmount = amount * (1 + amountTolerance);
  
  // Calculate date range (same day)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Find similar boxes
  const similarBoxes = await prisma.box.findMany({
    where: {
      organizationId,
      status: { notIn: ["CANCELLED", "DRAFT"] },
      totalAmount: { gte: minAmount, lte: maxAmount },
      boxDate: { gte: startOfDay, lte: endOfDay },
      ...(contactId ? { contactId } : {}),
    },
    select: {
      id: true,
      boxNumber: true,
      totalAmount: true,
      boxDate: true,
      contactId: true,
    },
  });

  if (similarBoxes.length === 0) {
    return { isDuplicate: false, existingBoxes: [], matchType: null };
  }

  // Calculate similarity score
  const results = similarBoxes.map((box) => {
    let similarity = 0;
    
    // Same amount (exact or close)
    const amountDiff = Math.abs(box.totalAmount.toNumber() - amount) / amount;
    if (amountDiff === 0) {
      similarity += 50;
    } else if (amountDiff < 0.001) {
      similarity += 40;
    } else if (amountDiff < 0.01) {
      similarity += 30;
    }
    
    // Same date
    if (box.boxDate.toDateString() === date.toDateString()) {
      similarity += 30;
    }
    
    // Same vendor
    if (contactId && box.contactId === contactId) {
      similarity += 20;
    }
    
    return {
      id: box.id,
      boxNumber: box.boxNumber,
      similarity,
    };
  });

  // Filter by minimum similarity threshold
  const matches = results.filter((r) => r.similarity >= 50);

  return {
    isDuplicate: matches.length > 0,
    existingBoxes: matches.sort((a, b) => b.similarity - a.similarity),
    matchType: matches.length > 0 ? "similar" : null,
  };
}

// ==================== Scan Box for Duplicates ====================

export async function scanBoxForDuplicates(boxId: string): Promise<ApiResponse<{
  possibleDuplicate: boolean;
  duplicateReason: string | null;
  matches: Array<{ id: string; boxNumber: string; reason: string }>;
}>> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      documents: {
        include: { files: true },
      },
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const matches: Array<{ id: string; boxNumber: string; reason: string }> = [];
  let duplicateReason: string | null = null;

  // Check by heuristic (amount + date + vendor)
  if (box.totalAmount.toNumber() > 0) {
    const heuristicResult = await checkDuplicateByHeuristic(
      session.currentOrganization.id,
      box.totalAmount.toNumber(),
      box.boxDate,
      box.contactId || undefined
    );

    for (const match of heuristicResult.existingBoxes) {
      if (match.id !== boxId) {
        matches.push({
          id: match.id,
          boxNumber: match.boxNumber,
          reason: `ยอดเงิน+วันที่${box.contactId ? "+คู่ค้า" : ""} ตรงกัน (${match.similarity}%)`,
        });
      }
    }
  }

  // Check by file hash
  for (const doc of box.documents) {
    for (const file of doc.files) {
      if (file.checksum) {
        const existingFile = await prisma.documentFile.findFirst({
          where: {
            checksum: file.checksum,
            id: { not: file.id },
            document: {
              box: { 
                organizationId: session.currentOrganization.id,
                status: { notIn: ["CANCELLED"] },
              },
            },
          },
          include: {
            document: {
              include: {
                box: { select: { id: true, boxNumber: true } },
              },
            },
          },
        });

        if (existingFile && existingFile.document.box.id !== boxId) {
          const alreadyMatched = matches.some(m => m.id === existingFile.document.box.id);
          if (!alreadyMatched) {
            matches.push({
              id: existingFile.document.box.id,
              boxNumber: existingFile.document.box.boxNumber,
              reason: "ไฟล์ซ้ำกัน (Hash match)",
            });
          }
        }
      }
    }
  }

  const possibleDuplicate = matches.length > 0;
  if (possibleDuplicate) {
    duplicateReason = matches.map(m => `${m.boxNumber}: ${m.reason}`).join("; ");
  }

  // Update box with duplicate info
  await prisma.box.update({
    where: { id: boxId },
    data: {
      possibleDuplicate,
      duplicateReason,
    },
  });

  revalidatePath(`/documents/${boxId}`);

  return {
    success: true,
    data: { possibleDuplicate, duplicateReason, matches },
  };
}

// ==================== Batch Scan for Duplicates ====================

export async function batchScanForDuplicates(): Promise<ApiResponse<{
  scanned: number;
  duplicatesFound: number;
}>> {
  const session = await requireOrganization();
  
  // Get all boxes that haven't been scanned
  const boxes = await prisma.box.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      status: { notIn: ["CANCELLED", "ARCHIVED", "LOCKED"] },
      possibleDuplicate: false, // Only scan boxes not already flagged
    },
    select: { id: true },
    take: 100, // Limit batch size
  });

  let duplicatesFound = 0;

  for (const box of boxes) {
    const result = await scanBoxForDuplicates(box.id);
    if (result.success && result.data?.possibleDuplicate) {
      duplicatesFound++;
    }
  }

  return {
    success: true,
    data: {
      scanned: boxes.length,
      duplicatesFound,
    },
    message: `สแกน ${boxes.length} กล่อง พบที่อาจซ้ำ ${duplicatesFound} กล่อง`,
  };
}

// ==================== Clear Duplicate Flag ====================

export async function clearDuplicateFlag(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  await prisma.box.update({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    data: {
      possibleDuplicate: false,
      duplicateReason: null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "DUPLICATE_CLEARED",
    },
  });

  revalidatePath(`/documents/${boxId}`);

  return {
    success: true,
    message: "นำเครื่องหมายซ้ำออกแล้ว",
  };
}

// ==================== Get Potential Duplicates ====================

export async function getPotentialDuplicates() {
  const session = await requireOrganization();
  
  return prisma.box.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      possibleDuplicate: true,
      status: { notIn: ["CANCELLED"] },
    },
    include: {
      contact: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==================== Calculate File Checksum ====================

export async function calculateChecksum(buffer: Buffer): Promise<string> {
  return crypto.createHash("md5").update(buffer).digest("hex");
}
