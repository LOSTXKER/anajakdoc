"use server";

/**
 * Document Template Actions
 * 
 * Features:
 * - Template CRUD
 * - Auto-suggest templates based on OCR data
 * - Track template usage
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { DocType, ExpenseType } from "@prisma/client";

type ApiResponse<T = void> = { success: true; data: T } | { success: false; error: string };

// ============================================
// TYPES
// ============================================

export interface TemplateData {
  id: string;
  name: string;
  contactId: string | null;
  contactName: string | null;
  docType: DocType;
  categoryId: string | null;
  categoryName: string | null;
  costCenterId: string | null;
  costCenterName: string | null;
  expenseType: ExpenseType | null;
  expectedAmount: number | null;
  amountVariance: number;
  description: string | null;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
}

export interface TemplateSuggestion {
  template: TemplateData;
  matchScore: number;
  matchReasons: string[];
}

// ============================================
// GET TEMPLATES
// ============================================

export async function getTemplates(): Promise<ApiResponse<TemplateData[]>> {
  const session = await requireOrganization();

  const templates = await prisma.documentTemplate.findMany({
    where: { organizationId: session.currentOrganization.id },
    include: {
      contact: { select: { name: true } },
      category: { select: { name: true } },
      costCenter: { select: { name: true } },
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
  });

  return {
    success: true,
    data: templates.map((t) => ({
      id: t.id,
      name: t.name,
      contactId: t.contactId,
      contactName: t.contact?.name || null,
      docType: t.docType,
      categoryId: t.categoryId,
      categoryName: t.category?.name || null,
      costCenterId: t.costCenterId,
      costCenterName: t.costCenter?.name || null,
      expenseType: t.expenseType,
      expectedAmount: t.expectedAmount ? Number(t.expectedAmount) : null,
      amountVariance: Number(t.amountVariance),
      description: t.description,
      isActive: t.isActive,
      usageCount: t.usageCount,
      lastUsedAt: t.lastUsedAt?.toISOString() || null,
    })),
  };
}

// ============================================
// CREATE TEMPLATE
// ============================================

export async function createTemplate(data: {
  name: string;
  contactId?: string;
  docType: DocType;
  categoryId?: string;
  costCenterId?: string;
  expenseType?: ExpenseType;
  expectedAmount?: number;
  amountVariance?: number;
  description?: string;
}): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  if (!data.name) {
    return { success: false, error: "กรุณากรอกชื่อ Template" };
  }

  const template = await prisma.documentTemplate.create({
    data: {
      organizationId: session.currentOrganization.id,
      name: data.name,
      contactId: data.contactId,
      docType: data.docType,
      categoryId: data.categoryId,
      costCenterId: data.costCenterId,
      expenseType: data.expenseType,
      expectedAmount: data.expectedAmount,
      amountVariance: data.amountVariance ?? 0.1,
      description: data.description,
    },
  });

  revalidatePath("/settings/templates");
  return { success: true, data: { id: template.id } };
}

// ============================================
// UPDATE TEMPLATE
// ============================================

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    contactId?: string | null;
    docType?: DocType;
    categoryId?: string | null;
    costCenterId?: string | null;
    expenseType?: ExpenseType | null;
    expectedAmount?: number | null;
    amountVariance?: number;
    description?: string | null;
    isActive?: boolean;
  }
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!template) {
    return { success: false, error: "ไม่พบ Template" };
  }

  await prisma.documentTemplate.update({
    where: { id },
    data,
  });

  revalidatePath("/settings/templates");
  return { success: true, data: undefined };
}

// ============================================
// DELETE TEMPLATE
// ============================================

export async function deleteTemplate(id: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!template) {
    return { success: false, error: "ไม่พบ Template" };
  }

  await prisma.documentTemplate.delete({
    where: { id },
  });

  revalidatePath("/settings/templates");
  return { success: true, data: undefined };
}

// ============================================
// SUGGEST TEMPLATES FROM OCR DATA
// ============================================

export async function suggestTemplates(ocrData: {
  contactName?: string;
  contactTaxId?: string;
  amount?: number;
  docType?: string;
}): Promise<ApiResponse<TemplateSuggestion[]>> {
  const session = await requireOrganization();

  // Get all active templates
  const templates = await prisma.documentTemplate.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      isActive: true,
    },
    include: {
      contact: { select: { name: true, taxId: true } },
      category: { select: { name: true } },
      costCenter: { select: { name: true } },
    },
  });

  if (templates.length === 0) {
    return { success: true, data: [] };
  }

  const suggestions: TemplateSuggestion[] = [];

  for (const template of templates) {
    let score = 0;
    const reasons: string[] = [];

    // Match by contact tax ID (strongest signal)
    if (ocrData.contactTaxId && template.contact?.taxId) {
      const ocrTaxId = ocrData.contactTaxId.replace(/\D/g, "");
      const templateTaxId = template.contact.taxId.replace(/\D/g, "");
      if (ocrTaxId === templateTaxId) {
        score += 50;
        reasons.push("เลขประจำตัวผู้เสียภาษีตรงกัน");
      }
    }

    // Match by contact name (fuzzy)
    if (ocrData.contactName && template.contact?.name) {
      const similarity = calculateNameSimilarity(
        ocrData.contactName,
        template.contact.name
      );
      if (similarity >= 0.7) {
        score += 30;
        reasons.push(`ชื่อผู้ติดต่อคล้ายกัน (${Math.round(similarity * 100)}%)`);
      }
    }

    // Match by amount (within variance)
    if (ocrData.amount && template.expectedAmount) {
      const expectedAmount = Number(template.expectedAmount);
      const variance = Number(template.amountVariance);
      const diff = Math.abs(ocrData.amount - expectedAmount);
      const percentDiff = diff / expectedAmount;

      if (percentDiff <= variance) {
        score += 20;
        reasons.push(`ยอดเงินใกล้เคียง (±${Math.round(variance * 100)}%)`);
      }
    }

    // Only include if score is positive
    if (score >= 30) {
      suggestions.push({
        template: {
          id: template.id,
          name: template.name,
          contactId: template.contactId,
          contactName: template.contact?.name || null,
          docType: template.docType,
          categoryId: template.categoryId,
          categoryName: template.category?.name || null,
          costCenterId: template.costCenterId,
          costCenterName: template.costCenter?.name || null,
          expenseType: template.expenseType,
          expectedAmount: template.expectedAmount ? Number(template.expectedAmount) : null,
          amountVariance: Number(template.amountVariance),
          description: template.description,
          isActive: template.isActive,
          usageCount: template.usageCount,
          lastUsedAt: template.lastUsedAt?.toISOString() || null,
        },
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
      });
    }
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  return { success: true, data: suggestions.slice(0, 5) };
}

// ============================================
// USE TEMPLATE (increment usage count)
// ============================================

export async function useTemplate(id: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!template) {
    return { success: false, error: "ไม่พบ Template" };
  }

  await prisma.documentTemplate.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  return { success: true, data: undefined };
}

// ============================================
// CREATE TEMPLATE FROM BOX
// ============================================

export async function createTemplateFromBox(
  boxId: string,
  name: string
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      documents: { take: 1 },
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const template = await prisma.documentTemplate.create({
    data: {
      organizationId: session.currentOrganization.id,
      name,
      contactId: box.contactId,
      docType: box.documents[0]?.docType || "OTHER",
      categoryId: box.categoryId,
      costCenterId: box.costCenterId,
      expenseType: box.expenseType,
      expectedAmount: box.totalAmount,
      description: box.description,
    },
  });

  return { success: true, data: { id: template.id } };
}

// ============================================
// HELPERS
// ============================================

// Simple name similarity using Jaccard index
function calculateNameSimilarity(name1: string, name2: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/บริษัท|จำกัด|มหาชน|ltd|co\.|inc\.|corp\./gi, "")
      .replace(/[^\u0E00-\u0E7Fa-z0-9]/gi, " ")
      .split(/\s+/)
      .filter((x) => x.length > 1);

  const set1 = new Set(normalize(name1));
  const set2 = new Set(normalize(name2));

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
