"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

interface LineInput {
  description?: string;
  quantity: number;
  unitPrice: number;
}

export async function addDocumentLine(
  documentId: string,
  line: LineInput
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสาร",
    };
  }

  // Get max line number
  const lastLine = await prisma.documentLine.findFirst({
    where: { documentId },
    orderBy: { lineNumber: "desc" },
  });

  const lineNumber = (lastLine?.lineNumber || 0) + 1;
  const amount = line.quantity * line.unitPrice;

  const newLine = await prisma.documentLine.create({
    data: {
      documentId,
      lineNumber,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount,
    },
  });

  // Update document subtotal
  await updateDocumentTotal(documentId);

  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
    data: { id: newLine.id },
  };
}

export async function updateDocumentLine(
  lineId: string,
  line: LineInput
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const existingLine = await prisma.documentLine.findFirst({
    where: {
      id: lineId,
      document: { organizationId: session.currentOrganization.id },
    },
  });

  if (!existingLine) {
    return {
      success: false,
      error: "ไม่พบรายการ",
    };
  }

  const amount = line.quantity * line.unitPrice;

  await prisma.documentLine.update({
    where: { id: lineId },
    data: {
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount,
    },
  });

  // Update document subtotal
  await updateDocumentTotal(existingLine.documentId);

  revalidatePath(`/documents/${existingLine.documentId}`);

  return {
    success: true,
  };
}

export async function deleteDocumentLine(lineId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const existingLine = await prisma.documentLine.findFirst({
    where: {
      id: lineId,
      document: { organizationId: session.currentOrganization.id },
    },
  });

  if (!existingLine) {
    return {
      success: false,
      error: "ไม่พบรายการ",
    };
  }

  const documentId = existingLine.documentId;

  await prisma.documentLine.delete({
    where: { id: lineId },
  });

  // Renumber remaining lines
  const remainingLines = await prisma.documentLine.findMany({
    where: { documentId },
    orderBy: { lineNumber: "asc" },
  });

  for (let i = 0; i < remainingLines.length; i++) {
    await prisma.documentLine.update({
      where: { id: remainingLines[i].id },
      data: { lineNumber: i + 1 },
    });
  }

  // Update document subtotal
  await updateDocumentTotal(documentId);

  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
  };
}

export async function saveDocumentLines(
  documentId: string,
  lines: LineInput[]
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสาร",
    };
  }

  // Delete all existing lines
  await prisma.documentLine.deleteMany({
    where: { documentId },
  });

  // Create new lines
  if (lines.length > 0) {
    await prisma.documentLine.createMany({
      data: lines.map((line, index) => ({
        documentId,
        lineNumber: index + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.quantity * line.unitPrice,
      })),
    });
  }

  // Update document subtotal
  await updateDocumentTotal(documentId);

  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
  };
}

async function updateDocumentTotal(documentId: string) {
  const lines = await prisma.documentLine.findMany({
    where: { documentId },
  });

  const subtotal = lines.reduce((sum, line) => sum + line.amount.toNumber(), 0);

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (document) {
    const vatAmount = document.vatAmount.toNumber();
    const whtAmount = document.whtAmount.toNumber();
    const totalAmount = subtotal + vatAmount - whtAmount;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        subtotal,
        totalAmount,
      },
    });
  }
}
