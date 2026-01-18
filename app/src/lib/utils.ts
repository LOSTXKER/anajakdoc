import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { 
  DocumentWithRelations, 
  SerializedDocument, 
  SubDocumentWithFiles,
  SerializedSubDocument,
  WHTTrackingWithContact,
  SerializedWHTTracking
} from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Decimal to number
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return Number(value.toString());
  }
  return Number(value);
}

// Convert Decimal to number or null
export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return Number(value.toString());
  }
  return Number(value);
}

// Serialize SubDocument for Client Components
export function serializeSubDocument(subDoc: SubDocumentWithFiles): SerializedSubDocument {
  return {
    ...subDoc,
    amount: toNumberOrNull(subDoc.amount),
    vatAmount: toNumberOrNull(subDoc.vatAmount),
    docDate: subDoc.docDate?.toISOString() || null,
    createdAt: subDoc.createdAt.toISOString(),
    updatedAt: subDoc.updatedAt.toISOString(),
  };
}

// Serialize multiple SubDocuments
export function serializeSubDocuments(subDocs: SubDocumentWithFiles[]): SerializedSubDocument[] {
  return subDocs.map(serializeSubDocument);
}

// Serialize WHT Tracking for Client Components
export function serializeWHTTracking(wht: WHTTrackingWithContact): SerializedWHTTracking {
  return {
    ...wht,
    whtAmount: toNumber(wht.whtAmount),
    whtRate: toNumber(wht.whtRate),
    issuedDate: wht.issuedDate?.toISOString() || null,
    sentDate: wht.sentDate?.toISOString() || null,
    confirmedDate: wht.confirmedDate?.toISOString() || null,
    receivedDate: wht.receivedDate?.toISOString() || null,
    createdAt: wht.createdAt.toISOString(),
    updatedAt: wht.updatedAt.toISOString(),
  };
}

// Serialize multiple WHT Trackings
export function serializeWHTTrackings(whts: WHTTrackingWithContact[]): SerializedWHTTracking[] {
  return whts.map(serializeWHTTracking);
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
    subDocuments: doc.subDocuments ? serializeSubDocuments(doc.subDocuments) : [],
    whtTrackings: doc.whtTrackings ? serializeWHTTrackings(doc.whtTrackings) : [],
  };
}

// Serialize multiple documents
export function serializeDocuments(docs: DocumentWithRelations[]): SerializedDocument[] {
  return docs.map(serializeDocument);
}
