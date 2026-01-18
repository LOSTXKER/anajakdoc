"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

export async function createExpenseGroup(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string || null;

  if (!name) {
    return {
      success: false,
      error: "กรุณากรอกชื่อกลุ่ม",
    };
  }

  const group = await prisma.expenseGroup.create({
    data: {
      organizationId: session.currentOrganization.id,
      name,
      description,
    },
  });

  revalidatePath("/expense-groups");

  return {
    success: true,
    data: { id: group.id },
  };
}

export async function deleteExpenseGroup(id: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const group = await prisma.expenseGroup.findFirst({
    where: {
      id,
      organizationId: session.currentOrganization.id,
    },
    include: {
      _count: { select: { documents: true } },
    },
  });

  if (!group) {
    return {
      success: false,
      error: "ไม่พบกลุ่ม",
    };
  }

  // Remove documents from group first
  await prisma.document.updateMany({
    where: { expenseGroupId: id },
    data: { expenseGroupId: null },
  });

  await prisma.expenseGroup.delete({
    where: { id },
  });

  revalidatePath("/expense-groups");

  return {
    success: true,
  };
}

export async function addDocumentToGroup(
  groupId: string,
  documentId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const [group, document] = await Promise.all([
    prisma.expenseGroup.findFirst({
      where: {
        id: groupId,
        organizationId: session.currentOrganization.id,
      },
    }),
    prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: session.currentOrganization.id,
      },
    }),
  ]);

  if (!group || !document) {
    return {
      success: false,
      error: "ไม่พบกลุ่มหรือเอกสาร",
    };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { expenseGroupId: groupId },
  });

  // Update group total
  const total = await prisma.document.aggregate({
    where: { expenseGroupId: groupId },
    _sum: { totalAmount: true },
  });

  await prisma.expenseGroup.update({
    where: { id: groupId },
    data: { totalAmount: total._sum.totalAmount || 0 },
  });

  revalidatePath("/expense-groups");
  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
  };
}

export async function removeDocumentFromGroup(documentId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document || !document.expenseGroupId) {
    return {
      success: false,
      error: "ไม่พบเอกสารในกลุ่ม",
    };
  }

  const groupId = document.expenseGroupId;

  await prisma.document.update({
    where: { id: documentId },
    data: { expenseGroupId: null },
  });

  // Update group total
  const total = await prisma.document.aggregate({
    where: { expenseGroupId: groupId },
    _sum: { totalAmount: true },
  });

  await prisma.expenseGroup.update({
    where: { id: groupId },
    data: { totalAmount: total._sum.totalAmount || 0 },
  });

  revalidatePath("/expense-groups");
  revalidatePath(`/documents/${documentId}`);

  return {
    success: true,
  };
}
