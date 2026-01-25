import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { 
  BoxWithRelations, 
  SerializedBox, 
  SerializedContact,
  DocumentWithFiles,
  SerializedDocument,
  SerializedPayment,
  WhtTrackingWithContact,
  WhtTrackingWithBox,
  SerializedWhtTracking,
  WhtStatus,
  WhtType,
  DocType
} from "@/types"
import type { Payment, Contact } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate URL-friendly slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-ก-๙]/g, "") // Remove special chars except Thai
    .replace(/[\s_]+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
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

// Serialize Document (within Box) for Client Components
export function serializeDocument(doc: DocumentWithFiles): SerializedDocument {
  return {
    ...doc,
    amount: toNumberOrNull(doc.amount),
    vatAmount: toNumberOrNull(doc.vatAmount),
    foreignAmount: toNumberOrNull(doc.foreignAmount),
    docDate: doc.docDate?.toISOString() || null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// Serialize multiple Documents
export function serializeDocuments(docs: DocumentWithFiles[]): SerializedDocument[] {
  return docs.map(serializeDocument);
}

// Serialize Payment for Client Components
export function serializePayment(payment: Payment): SerializedPayment {
  return {
    ...payment,
    amount: toNumber(payment.amount),
    paidDate: payment.paidDate instanceof Date ? payment.paidDate.toISOString() : payment.paidDate,
    createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
  };
}

// Serialize WHT Tracking for Client Components
export function serializeWhtTracking(wht: WhtTrackingWithBox): SerializedWhtTracking {
  const { box, contact, ...rest } = wht;
  
  return {
    ...rest,
    amount: toNumber(wht.amount),
    rate: toNumberOrNull(wht.rate),
    issuedDate: wht.issuedDate?.toISOString() || null,
    sentDate: wht.sentDate?.toISOString() || null,
    receivedDate: wht.receivedDate?.toISOString() || null,
    dueDate: wht.dueDate?.toISOString() || null,
    createdAt: wht.createdAt.toISOString(),
    updatedAt: wht.updatedAt.toISOString(),
    // Serialize contact with Decimal/Date fields
    contact: contact ? serializeContact(contact) : null,
    box: box ? {
      id: box.id,
      boxNumber: box.boxNumber,
      title: box.title,
      totalAmount: toNumber(box.totalAmount),
      boxDate: box.boxDate instanceof Date ? box.boxDate.toISOString() : box.boxDate,
    } : null,
  };
}

// Serialize multiple WHT Trackings
export function serializeWhtTrackings(whts: WhtTrackingWithBox[]): SerializedWhtTracking[] {
  return whts.map(serializeWhtTracking);
}

// Helper to serialize Date to string
function dateToString(date: unknown): string | null {
  if (!date) return null;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === "string") return date;
  return null;
}

// Serialize Contact for Client Components
export function serializeContact(contact: Contact): SerializedContact;
export function serializeContact(contact: null): null;
export function serializeContact(contact: Contact | null): SerializedContact | null {
  if (!contact) return null;
  return {
    ...contact,
    defaultWhtRate: toNumberOrNull(contact.defaultWhtRate),
    createdAt: dateToString(contact.createdAt) || "",
    updatedAt: dateToString(contact.updatedAt) || "",
    lastUsedAt: dateToString(contact.lastUsedAt),
  };
}

// Serialize Box for Client Components
export function serializeBox(box: BoxWithRelations): SerializedBox {
  return {
    ...box,
    totalAmount: toNumber(box.totalAmount),
    vatAmount: toNumber(box.vatAmount),
    whtAmount: toNumber(box.whtAmount),
    paidAmount: toNumber(box.paidAmount),
    vatRate: toNumberOrNull(box.vatRate),
    whtRate: toNumberOrNull(box.whtRate),
    foreignAmount: toNumberOrNull(box.foreignAmount),
    exchangeRate: toNumberOrNull(box.exchangeRate),
    boxDate: box.boxDate.toISOString(),
    dueDate: box.dueDate?.toISOString() || null,
    whtDueDate: box.whtDueDate?.toISOString() || null,
    vatVerifiedAt: box.vatVerifiedAt?.toISOString() || null,
    submittedAt: box.submittedAt?.toISOString() || null,
    reviewedAt: box.reviewedAt?.toISOString() || null,
    bookedAt: box.bookedAt?.toISOString() || null,
    exportedAt: box.exportedAt?.toISOString() || null,
    archivedAt: box.archivedAt?.toISOString() || null,
    lockedAt: box.lockedAt?.toISOString() || null,
    createdAt: box.createdAt.toISOString(),
    updatedAt: box.updatedAt.toISOString(),
    // Serialize contact with Decimal/Date fields
    contact: box.contact ? serializeContact(box.contact) : null,
    documents: box.documents ? serializeDocuments(box.documents) : [],
    payments: box.payments ? box.payments.map(serializePayment) : [],
    whtTrackings: box.whtTrackings ? box.whtTrackings.map(wht => ({
      ...wht,
      amount: toNumber(wht.amount),
      rate: toNumberOrNull(wht.rate),
      issuedDate: wht.issuedDate?.toISOString() || null,
      sentDate: wht.sentDate?.toISOString() || null,
      receivedDate: wht.receivedDate?.toISOString() || null,
      dueDate: wht.dueDate?.toISOString() || null,
      createdAt: wht.createdAt.toISOString(),
      updatedAt: wht.updatedAt.toISOString(),
      contact: wht.contact ? serializeContact(wht.contact) : null,
      box: null,
    })) : [],
    tasks: box.tasks ? box.tasks.map(t => ({
      ...t,
      dueDate: t.dueDate?.toISOString() || null,
      completedAt: t.completedAt?.toISOString() || null,
      lastReminderAt: t.lastReminderAt?.toISOString() || null,
      escalatedAt: t.escalatedAt?.toISOString() || null,
      cancelledAt: t.cancelledAt?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })) : [],
  };
}

// Serialize multiple Boxes
export function serializeBoxes(boxes: BoxWithRelations[]): SerializedBox[] {
  return boxes.map(serializeBox);
}

// Get WHT Status label
export function getWhtStatusLabel(status: WhtStatus): string {
  const labels: Record<WhtStatus, string> = {
    PENDING: "รอดำเนินการ",
    ISSUED: "ออกเอกสารแล้ว",
    SENT: "ส่งแล้ว",
    CONFIRMED: "ยืนยันรับแล้ว",
    RECEIVED: "ได้รับแล้ว",
  };
  return labels[status] || status;
}

// Get WHT Type label
export function getWhtTypeLabel(type: WhtType): string {
  const labels: Record<WhtType, string> = {
    OUTGOING: "ต้องส่งออก",
    INCOMING: "รอรับเข้า",
  };
  return labels[type] || type;
}

// Get DocType label
export function getDocTypeLabel(docType: DocType): string {
  const labels: Record<DocType, string> = {
    SLIP_TRANSFER: "สลิปโอนเงิน",
    SLIP_CHEQUE: "สำเนาเช็ค",
    BANK_STATEMENT: "Statement ธนาคาร",
    CREDIT_CARD_STATEMENT: "Statement บัตรเครดิต",
    ONLINE_RECEIPT: "Paypal/Stripe Receipt",
    PETTY_CASH_VOUCHER: "ใบสำคัญจ่ายเงินสด",
    TAX_INVOICE: "ใบกำกับภาษี",
    TAX_INVOICE_ABB: "ใบกำกับภาษีอย่างย่อ",
    RECEIPT: "ใบเสร็จรับเงิน",
    CASH_RECEIPT: "บิลเงินสด",
    INVOICE: "ใบแจ้งหนี้",
    FOREIGN_INVOICE: "Invoice ต่างประเทศ",
    CUSTOMS_FORM: "ใบขนสินค้า",
    DELIVERY_NOTE: "ใบส่งของ",
    CREDIT_NOTE: "ใบลดหนี้",
    DEBIT_NOTE: "ใบเพิ่มหนี้",
    REFUND_RECEIPT: "หลักฐานคืนเงิน",
    WHT_SENT: "หัก ณ ที่จ่าย (ออก)",
    WHT_RECEIVED: "หัก ณ ที่จ่าย (รับกลับ)",
    WHT_INCOMING: "หัก ณ ที่จ่าย (เขาหักเรา)",
    TAX_PAYMENT_SLIP: "ใบนำส่งภาษี",
    TAX_RECEIPT_GOVT: "ใบเสร็จจากสรรพากร",
    SSO_PAYMENT: "ประกันสังคม",
    GOVT_RECEIPT: "ใบเสร็จราชการ",
    CONTRACT: "สัญญา",
    QUOTATION: "ใบเสนอราคา",
    PURCHASE_ORDER: "ใบสั่งซื้อ",
    CLAIM_FORM: "ใบเบิกเงิน",
    OTHER: "อื่นๆ",
  };
  return labels[docType] || docType;
}
