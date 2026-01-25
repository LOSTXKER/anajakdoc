"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";
import type { ApiResponse, CreateBookingEntryInput, PaginatedResponse } from "@/types";
import { BoxStatus, NotificationType } from "@prisma/client";

// ==================== Generate Entry Number ====================

async function generateEntryNumber(organizationId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `ENTRY-${year}${month}`;

  // Count existing entries this month
  const count = await prisma.bookingEntry.count({
    where: {
      organizationId,
      entryNumber: { startsWith: prefix },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}-${sequence}`;
}

// ==================== Create Booking Entry (Section 8) ====================

export async function createBookingEntry(
  input: CreateBookingEntryInput
): Promise<ApiResponse<{ id: string; entryNumber: string }>> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์สร้าง Booking Entry" };
  }

  if (input.boxIds.length === 0) {
    return { success: false, error: "กรุณาเลือกกล่องอย่างน้อย 1 กล่อง" };
  }

  // Verify boxes exist and are in correct status (PENDING = ready to book)
  const boxes = await prisma.box.findMany({
    where: {
      id: { in: input.boxIds },
      organizationId: session.currentOrganization.id,
      status: BoxStatus.PENDING,
    },
  });

  if (boxes.length !== input.boxIds.length) {
    return {
      success: false,
      error: "บางกล่องไม่อยู่ในสถานะที่สามารถลงบัญชีได้",
    };
  }

  // Calculate total amount
  const totalAmount = boxes.reduce(
    (sum, box) => sum + box.totalAmount.toNumber(),
    0
  );

  // Generate entry number
  const entryNumber = await generateEntryNumber(session.currentOrganization.id);

  // Create entry and update boxes
  const entry = await prisma.$transaction(async (tx) => {
    const newEntry = await tx.bookingEntry.create({
      data: {
        organizationId: session.currentOrganization.id,
        entryNumber,
        description: input.description,
        totalAmount,
        bookedAt: new Date(),
        bookedById: session.id,
        exportProfile: input.exportProfile,
      },
    });

    // Link boxes to entry and update status to COMPLETED
    await tx.box.updateMany({
      where: { id: { in: input.boxIds } },
      data: {
        bookingEntryId: newEntry.id,
        status: BoxStatus.COMPLETED,
        bookedAt: new Date(),
      },
    });

    // Create activity logs
    for (const boxId of input.boxIds) {
      await tx.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: "BOOKED",
          details: { entryId: newEntry.id, entryNumber },
        },
      });
    }

    return newEntry;
  });

  // Notify box creators
  const creatorIds = [...new Set(boxes.map((b) => b.createdById))];
  for (const creatorId of creatorIds) {
    if (creatorId !== session.id) {
      await createNotification(
        session.currentOrganization.id,
        creatorId,
        NotificationType.BOX_BOOKED,
        "ลงบัญชีแล้ว",
        `กล่องของคุณถูกลงบัญชีใน ${entryNumber}`,
        { entryId: entry.id }
      );
    }
  }

  revalidatePath("/documents");

  return {
    success: true,
    data: { id: entry.id, entryNumber: entry.entryNumber },
    message: `สร้าง Booking Entry ${entryNumber} เรียบร้อย (${boxes.length} กล่อง)`,
  };
}

// ==================== Link Boxes to Entry ====================

export async function linkBoxesToEntry(
  entryId: string,
  boxIds: string[]
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไข Booking Entry" };
  }

  const entry = await prisma.bookingEntry.findFirst({
    where: {
      id: entryId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!entry) {
    return { success: false, error: "ไม่พบ Booking Entry" };
  }

  // Verify boxes (PENDING = ready to book)
  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
      status: BoxStatus.PENDING,
    },
  });

  if (boxes.length === 0) {
    return { success: false, error: "ไม่พบกล่องที่สามารถเพิ่มได้" };
  }

  // Calculate new total
  const addedAmount = boxes.reduce(
    (sum, box) => sum + box.totalAmount.toNumber(),
    0
  );
  const newTotal = entry.totalAmount.toNumber() + addedAmount;

  await prisma.$transaction(async (tx) => {
    // Update entry total
    await tx.bookingEntry.update({
      where: { id: entryId },
      data: { totalAmount: newTotal },
    });

    // Link and update boxes to COMPLETED
    await tx.box.updateMany({
      where: { id: { in: boxIds } },
      data: {
        bookingEntryId: entryId,
        status: BoxStatus.COMPLETED,
        bookedAt: new Date(),
      },
    });

    // Activity logs
    for (const boxId of boxIds) {
      await tx.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: "LINKED_TO_ENTRY",
          details: { entryId, entryNumber: entry.entryNumber },
        },
      });
    }
  });

  revalidatePath("/documents");

  return {
    success: true,
    message: `เพิ่ม ${boxes.length} กล่องเข้า ${entry.entryNumber}`,
  };
}

// ==================== Unlink Box from Entry ====================

export async function unlinkBoxFromEntry(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไข" };
  }

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      bookingEntryId: { not: null },
    },
    include: { bookingEntry: true },
  });

  if (!box || !box.bookingEntry) {
    return { success: false, error: "ไม่พบกล่องหรือกล่องไม่ได้ผูกกับ Entry" };
  }

  // Check if entry is exported
  if (box.bookingEntry.exportedAt) {
    return { success: false, error: "ไม่สามารถแก้ไข Entry ที่ Export แล้ว" };
  }

  await prisma.$transaction(async (tx) => {
    // Unlink box - revert to PENDING status
    await tx.box.update({
      where: { id: boxId },
      data: {
        bookingEntryId: null,
        status: BoxStatus.PENDING,
        bookedAt: null,
      },
    });

    // Update entry total
    const newTotal = box.bookingEntry!.totalAmount.toNumber() - box.totalAmount.toNumber();
    await tx.bookingEntry.update({
      where: { id: box.bookingEntryId! },
      data: { totalAmount: newTotal },
    });

    // Activity log
    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "UNLINKED_FROM_ENTRY",
        details: { entryId: box.bookingEntryId },
      },
    });
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${boxId}`);

  return { success: true, message: "นำกล่องออกจาก Entry แล้ว" };
}

// ==================== Get Booking Entry ====================

export async function getBookingEntry(entryId: string): Promise<{
  id: string;
  entryNumber: string;
  bookedAt: Date;
  bookedBy: { id: string; name: string | null; email: string };
  boxes: Array<{
    id: string;
    boxNumber: string;
    totalAmount: { toNumber: () => number };
    contact: { name: string } | null;
    category: { name: string } | null;
    documents: Array<{ files: Array<{ fileUrl: string }> }>;
  }>;
} | null> {
  const session = await requireOrganization();
  
  return prisma.bookingEntry.findFirst({
    where: {
      id: entryId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      bookedBy: { select: { id: true, name: true, email: true } },
      boxes: {
        include: {
          contact: true,
          category: true,
          documents: { include: { files: true } },
        },
      },
    },
  });
}

// ==================== Get Booking Entries List ====================

export async function getBookingEntries(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<unknown>> {
  const session = await requireOrganization();
  
  const where = { organizationId: session.currentOrganization.id };

  const [entries, total] = await Promise.all([
    prisma.bookingEntry.findMany({
      where,
      include: {
        bookedBy: { select: { id: true, name: true } },
        boxes: { select: { id: true, boxNumber: true } },
        _count: { select: { boxes: true } },
      },
      orderBy: { bookedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bookingEntry.count({ where }),
  ]);

  return {
    items: entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==================== Export Entry ====================

export async function markEntryExported(entryId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์" };
  }

  const entry = await prisma.bookingEntry.findFirst({
    where: {
      id: entryId,
      organizationId: session.currentOrganization.id,
    },
    include: { boxes: true },
  });

  if (!entry) {
    return { success: false, error: "ไม่พบ Entry" };
  }

  await prisma.$transaction(async (tx) => {
    // Mark entry as exported
    await tx.bookingEntry.update({
      where: { id: entryId },
      data: { exportedAt: new Date() },
    });

    // Update all linked boxes
    await tx.box.updateMany({
      where: { bookingEntryId: entryId },
      data: { exportedAt: new Date() },
    });
  });

  return { success: true, message: `Export ${entry.entryNumber} เรียบร้อย` };
}

// ==================== Delete Entry (if not exported) ====================

export async function deleteBookingEntry(entryId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์ลบ" };
  }

  const entry = await prisma.bookingEntry.findFirst({
    where: {
      id: entryId,
      organizationId: session.currentOrganization.id,
    },
    include: { boxes: true },
  });

  if (!entry) {
    return { success: false, error: "ไม่พบ Entry" };
  }

  if (entry.exportedAt) {
    return { success: false, error: "ไม่สามารถลบ Entry ที่ Export แล้ว" };
  }

  await prisma.$transaction(async (tx) => {
    // Unlink all boxes - revert to PENDING
    await tx.box.updateMany({
      where: { bookingEntryId: entryId },
      data: {
        bookingEntryId: null,
        status: BoxStatus.PENDING,
        bookedAt: null,
      },
    });

    // Delete entry
    await tx.bookingEntry.delete({ where: { id: entryId } });
  });

  revalidatePath("/documents");

  return { success: true, message: `ลบ ${entry.entryNumber} แล้ว` };
}

// ==================== Get Ready to Book Boxes ====================

export async function getReadyToBookBoxes() {
  const session = await requireOrganization();
  
  return prisma.box.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      status: BoxStatus.PENDING,
      bookingEntryId: null,
    },
    include: {
      contact: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { boxDate: "asc" },
  });
}

// ==================== Get Booking Summary ====================

export async function getBookingSummary() {
  const session = await requireOrganization();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [readyCount, bookedThisMonth, totalBooked] = await Promise.all([
    prisma.box.count({
      where: {
        organizationId: session.currentOrganization.id,
        status: BoxStatus.PENDING,
        bookingEntryId: null,
      },
    }),
    prisma.bookingEntry.count({
      where: {
        organizationId: session.currentOrganization.id,
        bookedAt: { gte: startOfMonth },
      },
    }),
    prisma.bookingEntry.count({
      where: { organizationId: session.currentOrganization.id },
    }),
  ]);

  return {
    readyToBook: readyCount,
    bookedThisMonth,
    totalEntries: totalBooked,
  };
}
