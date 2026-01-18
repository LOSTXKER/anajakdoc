import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Decimal } from "@prisma/client/runtime/library"
import type { DocumentWithRelations, SerializedDocument } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Decimal to number
function toNumber(value: Decimal | number | null): number {
  if (value === null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

// Serialize document for Client Components
export function serializeDocument(doc: DocumentWithRelations): SerializedDocument {
  return {
    ...doc,
    subtotal: toNumber(doc.subtotal),
    vatAmount: toNumber(doc.vatAmount),
    whtAmount: toNumber(doc.whtAmount),
    totalAmount: toNumber(doc.totalAmount),
    vatRate: toNumber(doc.vatRate),
    whtRate: doc.whtRate ? toNumber(doc.whtRate) : null,
    docDate: doc.docDate.toISOString(),
    dueDate: doc.dueDate?.toISOString() || null,
    submittedAt: doc.submittedAt?.toISOString() || null,
    reviewedAt: doc.reviewedAt?.toISOString() || null,
    exportedAt: doc.exportedAt?.toISOString() || null,
    bookedAt: doc.bookedAt?.toISOString() || null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
