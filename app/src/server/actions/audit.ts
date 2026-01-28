"use server";

/**
 * Audit & Evidence Export (Section 16)
 * 
 * Features:
 * - Export audit logs with hash verification
 * - Immutable evidence trail
 * - Legal-grade document integrity
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import * as XLSX from "xlsx";
import crypto from "crypto";
import type { ApiResponse } from "@/types";
import { ERROR_MESSAGES } from "@/lib/error-messages";

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  action: string;
  boxNumber: string | null;
  userName: string;
  userEmail: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
};

export type AuditExportResult = {
  downloadUrl: string;
  fileName: string;
  recordCount: number;
  hash: string; // SHA-256 hash for verification
  generatedAt: string;
};

// ============================================
// GET AUDIT LOGS
// ============================================

/**
 * Get audit logs for a specific box
 */
export async function getBoxAuditLogs(boxId: string): Promise<ApiResponse<AuditLogEntry[]>> {
  const session = await requireOrganization();

  // Verify box belongs to organization
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
  }

  const logs = await prisma.activityLog.findMany({
    where: { boxId },
    include: {
      user: {
        select: { name: true, email: true },
      },
      box: {
        select: { boxNumber: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      boxNumber: log.box?.boxNumber || null,
      userName: log.user.name || "ไม่ระบุ",
      userEmail: log.user.email,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
    })),
  };
}

/**
 * Get all audit logs for organization (with pagination)
 */
export async function getOrganizationAuditLogs(options: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  action?: string;
}): Promise<ApiResponse<{
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}>> {
  const session = await requireOrganization();

  const page = options.page || 1;
  const limit = Math.min(options.limit || 50, 100);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {
    box: {
      organizationId: session.currentOrganization.id,
    },
  };

  if (options.startDate) {
    where.createdAt = {
      ...(where.createdAt as Record<string, unknown> || {}),
      gte: new Date(options.startDate),
    };
  }

  if (options.endDate) {
    where.createdAt = {
      ...(where.createdAt as Record<string, unknown> || {}),
      lte: new Date(options.endDate),
    };
  }

  if (options.action) {
    where.action = options.action;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        box: {
          select: { boxNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    success: true,
    data: {
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        boxNumber: log.box?.boxNumber || null,
        userName: log.user.name || "ไม่ระบุ",
        userEmail: log.user.email,
        details: log.details as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// EXPORT AUDIT LOGS
// ============================================

/**
 * Export audit logs to Excel with hash verification
 */
export async function exportAuditLogs(options: {
  boxId?: string;
  startDate?: string;
  endDate?: string;
  format?: "xlsx" | "json";
}): Promise<ApiResponse<AuditExportResult>> {
  const session = await requireOrganization();

  // Build where clause
  const where: Record<string, unknown> = {};

  if (options.boxId) {
    const box = await prisma.box.findFirst({
      where: {
        id: options.boxId,
        organizationId: session.currentOrganization.id,
      },
    });

    if (!box) {
      return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
    }

    where.boxId = options.boxId;
  } else {
    where.box = {
      organizationId: session.currentOrganization.id,
    };
  }

  if (options.startDate) {
    where.createdAt = {
      ...(where.createdAt as Record<string, unknown> || {}),
      gte: new Date(options.startDate),
    };
  }

  if (options.endDate) {
    where.createdAt = {
      ...(where.createdAt as Record<string, unknown> || {}),
      lte: new Date(options.endDate),
    };
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true },
      },
      box: {
        select: { boxNumber: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (logs.length === 0) {
    return { success: false, error: "ไม่พบข้อมูล Audit Log" };
  }

  const generatedAt = new Date().toISOString();
  const format = options.format || "xlsx";

  // Prepare data
  const data = logs.map((log, index) => ({
    "ลำดับ": index + 1,
    "วันเวลา": new Date(log.createdAt).toLocaleString("th-TH"),
    "เลขที่กล่อง": log.box?.boxNumber || "-",
    "การดำเนินการ": translateAction(log.action),
    "ผู้ดำเนินการ": log.user.name || log.user.email,
    "อีเมล": log.user.email,
    "รายละเอียด": log.details ? JSON.stringify(log.details) : "-",
    "IP Address": log.ipAddress || "-",
    "Log ID": log.id,
    "Timestamp (ISO)": log.createdAt.toISOString(),
  }));

  // Calculate hash of the data
  const dataString = JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(dataString).digest("hex");

  // Add metadata row
  const metadata = {
    "Generated At": generatedAt,
    "Organization": session.currentOrganization.name,
    "Total Records": logs.length,
    "SHA-256 Hash": hash,
    "Generated By": session.email,
  };

  let downloadUrl: string;
  let fileName: string;

  if (format === "json") {
    // JSON export
    const jsonContent = JSON.stringify({
      metadata,
      records: data,
      hash,
    }, null, 2);
    
    downloadUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
    fileName = `audit_log_${new Date().toISOString().split("T")[0]}.json`;
  } else {
    // Excel export
    const workbook = XLSX.utils.book_new();
    
    // Audit logs sheet
    const logsSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, logsSheet, "Audit Logs");
    
    // Metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");
    
    const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
    downloadUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`;
    fileName = `audit_log_${new Date().toISOString().split("T")[0]}.xlsx`;
  }

  return {
    success: true,
    data: {
      downloadUrl,
      fileName,
      recordCount: logs.length,
      hash,
      generatedAt,
    },
  };
}

/**
 * Export box with all documents and audit trail (evidence package)
 */
export async function exportEvidencePackage(boxId: string): Promise<ApiResponse<{
  downloadUrl: string;
  fileName: string;
  hash: string;
}>> {
  const session = await requireOrganization();

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
      contact: true,
      category: true,
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  if (!box) {
    return { success: false, error: ERROR_MESSAGES.BOX_NOT_FOUND };
  }

  // Get audit logs
  const logs = await prisma.activityLog.findMany({
    where: { boxId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Create evidence package
  const evidence = {
    generatedAt: new Date().toISOString(),
    generatedBy: session.email,
    organization: session.currentOrganization.name,
    
    box: {
      id: box.id,
      boxNumber: box.boxNumber,
      boxType: box.boxType,
      boxDate: box.boxDate.toISOString(),
      status: box.status,
      docStatus: box.docStatus,
      totalAmount: Number(box.totalAmount),
      vatAmount: Number(box.vatAmount),
      whtAmount: Number(box.whtAmount),
      contact: box.contact?.name || null,
      category: box.category?.name || null,
      createdBy: box.createdBy.name || box.createdBy.email,
      createdAt: box.createdAt.toISOString(),
      updatedAt: box.updatedAt.toISOString(),
    },
    
    documents: box.documents.map((doc) => ({
      id: doc.id,
      docType: doc.docType,
      files: doc.files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        checksum: file.checksum,
        createdAt: file.createdAt.toISOString(),
      })),
    })),
    
    auditLog: logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      user: log.user.name || log.user.email,
      details: log.details,
      ipAddress: log.ipAddress,
    })),
  };

  // Calculate hash
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(evidence))
    .digest("hex");

  const finalPackage = {
    ...evidence,
    integrityHash: hash,
  };

  const jsonContent = JSON.stringify(finalPackage, null, 2);
  const downloadUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
  const fileName = `evidence_${box.boxNumber}_${new Date().toISOString().split("T")[0]}.json`;

  return {
    success: true,
    data: {
      downloadUrl,
      fileName,
      hash,
    },
  };
}

/**
 * Verify integrity of an evidence package
 */
export async function verifyEvidencePackage(packageContent: string): Promise<ApiResponse<{
  isValid: boolean;
  message: string;
}>> {
  try {
    const parsed = JSON.parse(packageContent);
    const { integrityHash, ...data } = parsed;

    if (!integrityHash) {
      return {
        success: true,
        data: {
          isValid: false,
          message: "ไม่พบ hash สำหรับตรวจสอบ",
        },
      };
    }

    // Recalculate hash
    const calculatedHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    const isValid = calculatedHash === integrityHash;

    return {
      success: true,
      data: {
        isValid,
        message: isValid
          ? "เอกสารไม่ถูกแก้ไข (Integrity verified)"
          : "เอกสารอาจถูกแก้ไข (Hash mismatch)",
      },
    };
  } catch {
    return {
      success: true,
      data: {
        isValid: false,
        message: "รูปแบบไฟล์ไม่ถูกต้อง",
      },
    };
  }
}

// ============================================
// HELPERS
// ============================================

function translateAction(action: string): string {
  const translations: Record<string, string> = {
    // Box actions
    CREATED: "สร้างกล่อง",
    UPDATED: "แก้ไขข้อมูล",
    STATUS_CHANGED: "เปลี่ยนสถานะ",
    SUBMITTED: "ส่งตรวจ",
    APPROVED: "อนุมัติ",
    REJECTED: "ปฏิเสธ",
    NEED_MORE_DOCS: "ขอเอกสารเพิ่ม",
    NEED_DOCS: "ขาดเอกสาร",
    BOOKED: "ลงบัญชี",
    COMPLETED: "เสร็จสิ้น",
    ARCHIVED: "เก็บถาวร",
    
    // File actions
    FILE_UPLOADED: "อัปโหลดไฟล์",
    FILE_ADDED: "เพิ่มไฟล์",
    FILE_DELETED: "ลบไฟล์",
    FILE_TYPE_CHANGED: "เปลี่ยนประเภทไฟล์",
    
    // Document status actions
    VAT_STATUS_UPDATE: "อัปเดทสถานะ VAT",
    WHT_STATUS_UPDATE: "อัปเดทสถานะหัก ณ ที่จ่าย",
    PAYMENT_PROOF_STATUS_UPDATE: "อัปเดทหลักฐานการชำระ",
    DOC_MARKED_NA: "ทำเครื่องหมายไม่มีเอกสาร",
    DOC_UNMARKED_NA: "ยกเลิกเครื่องหมายไม่มีเอกสาร",
    
    // Comment & task actions
    COMMENT_ADDED: "เพิ่มความคิดเห็น",
    TASK_CREATED: "สร้าง Task",
    TASK_COMPLETED: "Task เสร็จสิ้น",
    PAYMENT_ADDED: "บันทึกการชำระ",
    
    // Bulk actions
    BULK_APPROVED: "อนุมัติ (Bulk)",
    BULK_REJECTED: "ปฏิเสธ (Bulk)",
    BULK_REQUESTED_DOCS: "ขอเอกสาร (Bulk)",
    BULK_MARKED_READY: "ทำเครื่องหมาย Ready (Bulk)",
    BULK_BOOKED: "ลงบัญชี (Bulk)",
  };

  return translations[action] || action;
}
