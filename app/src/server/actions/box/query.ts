"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { BoxFilters, PaginatedResponse, BoxWithRelations, ApiResponse } from "@/types";
import { DocStatus } from "@prisma/client";

// ==================== Get Boxes ====================

export async function getBoxes(
  filters?: BoxFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<BoxWithRelations>> {
  const session = await requireOrganization();
  
  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
  };

  // Apply filters
  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }
  if (filters?.boxType) {
    where.boxType = filters.boxType;
  }
  if (filters?.expenseType?.length) {
    where.expenseType = { in: filters.expenseType };
  }
  if (filters?.docStatus?.length) {
    where.docStatus = { in: filters.docStatus };
  }
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters?.costCenterId) {
    where.costCenterId = filters.costCenterId;
  }
  if (filters?.contactId) {
    where.contactId = filters.contactId;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.boxDate = {};
    if (filters.dateFrom) {
      (where.boxDate as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.boxDate as Record<string, Date>).lte = filters.dateTo;
    }
  }
  if (filters?.search) {
    where.OR = [
      { boxNumber: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { externalRef: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.paymentStatus?.length) {
    where.paymentStatus = { in: filters.paymentStatus };
  }

  // For staff, only show their own boxes
  if (session.currentOrganization.role === "STAFF") {
    where.createdById = session.id;
  }

  const [total, items] = await Promise.all([
    prisma.box.count({ where }),
    prisma.box.findMany({
      where,
      include: {
        documents: {
          include: {
            files: { orderBy: { pageOrder: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
        payments: {
          orderBy: { paidDate: "desc" },
        },
        whtTrackings: {
          include: {
            contact: true,
          },
        },
        contact: true,
        costCenter: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        linkedBox: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { documents: true, payments: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items as unknown as BoxWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==================== Get Single Box ====================

export async function getBox(boxId: string): Promise<BoxWithRelations | null> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      ...(session.currentOrganization.role === "STAFF" 
        ? { createdById: session.id } 
        : {}),
    },
    include: {
      documents: {
        include: {
          files: { orderBy: { pageOrder: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { paidDate: "desc" },
      },
      whtTrackings: {
        include: {
          contact: true,
        },
      },
      contact: true,
      costCenter: true,
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      linkedBox: true,
      comments: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return box as unknown as BoxWithRelations | null;
}

// ==================== Search Boxes ====================

export async function searchBoxes(query: string) {
  const session = await requireOrganization();
  
  if (!query.trim()) {
    return [];
  }

  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
    OR: [
      { boxNumber: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { externalRef: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { contact: { name: { contains: query, mode: "insensitive" } } },
    ],
  };

  if (session.currentOrganization.role === "STAFF") {
    where.createdById = session.id;
  }

  const boxes = await prisma.box.findMany({
    where,
    select: {
      id: true,
      boxNumber: true,
      title: true,
      boxDate: true,
      totalAmount: true,
      status: true,
      docStatus: true,
      category: {
        select: { name: true },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return boxes;
}

// ==================== Get Pending Boxes for AI Matching ====================

export async function getPendingBoxes(boxType: "EXPENSE" | "INCOME"): Promise<ApiResponse<Array<{
  id: string;
  boxNumber: string;
  title: string | null;
  totalAmount: number;
  boxDate: Date;
  contactId: string | null;
  contactName: string | null;
  contactTaxId: string | null;
  hasSlip: boolean;
  hasTaxInvoice: boolean;
}>>> {
  const session = await requireOrganization();

  const boxes = await prisma.box.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      boxType,
      docStatus: DocStatus.INCOMPLETE,
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          taxId: true,
        },
      },
      documents: {
        select: {
          docType: true,
        },
      },
    },
    orderBy: {
      boxDate: "desc",
    },
    take: 50,
  });

  const result = boxes.map(box => {
    const docTypes = box.documents.map(d => d.docType);
    return {
      id: box.id,
      boxNumber: box.boxNumber,
      title: box.title,
      totalAmount: Number(box.totalAmount),
      boxDate: box.boxDate,
      contactId: box.contact?.id || null,
      contactName: box.contact?.name || null,
      contactTaxId: box.contact?.taxId || null,
      hasSlip: docTypes.includes("SLIP_TRANSFER"),
      hasTaxInvoice: docTypes.includes("TAX_INVOICE"),
    };
  });

  return { success: true, data: result };
}
