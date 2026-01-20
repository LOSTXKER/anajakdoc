"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/types";
import { BoxStatus } from "@prisma/client";

// ==================== Delete Box ====================

export async function deleteBox(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      status: BoxStatus.DRAFT,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารหรือไม่สามารถลบกล่องนี้ได้",
    };
  }

  // Only allow delete if user is owner or admin, or if it's their own draft
  if (
    session.currentOrganization.role === "STAFF" &&
    box.createdById !== session.id
  ) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ลบกล่องเอกสารนี้",
    };
  }

  await prisma.box.delete({
    where: { id: boxId },
  });

  revalidatePath("/documents");
  redirect("/documents");
}
