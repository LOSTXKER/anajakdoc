import { z } from "zod";
import { BoxType, ExpenseType, BoxStatus, PaymentMethod, DocType } from ".prisma/client";

// ==================== Box Validation ====================

export const createBoxSchema = z.object({
  boxType: z.nativeEnum(BoxType).default(BoxType.EXPENSE),
  expenseType: z.nativeEnum(ExpenseType).optional(),
  boxDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === "string" ? new Date(val) : val
  ),
  dueDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val ? (typeof val === "string" ? new Date(val) : val) : undefined
  ),
  // Amount fields - may not know until documents arrive
  totalAmount: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
  whtAmount: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  whtRate: z.coerce.number().min(0).max(100).optional(),
  isVatInclusive: z.boolean().default(true),
  hasVat: z.boolean().default(true),
  hasWht: z.boolean().default(false),
  // Foreign currency
  foreignCurrency: z.string().optional(),
  foreignAmount: z.coerce.number().min(0).optional(),
  exchangeRate: z.coerce.number().min(0).optional(),
  // No receipt
  noReceiptReason: z.string().optional(),
  // Info
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  externalRef: z.string().optional(),
  // Relations
  contactId: z.string().optional(),
  costCenterId: z.string().optional(),
  categoryId: z.string().optional(),
  linkedBoxId: z.string().optional(),
});

export const updateBoxSchema = createBoxSchema.partial().extend({
  status: z.nativeEnum(BoxStatus).optional(),
});

export const submitBoxSchema = z.object({
  boxId: z.string(),
});

export const reviewBoxSchema = z.object({
  boxId: z.string(),
  action: z.enum(["approve", "reject", "need_info"]),
  comment: z.string().optional(),
});

export type CreateBoxInput = z.infer<typeof createBoxSchema>;
export type UpdateBoxInput = z.infer<typeof updateBoxSchema>;

// ==================== Document Validation ====================

export const createDocumentSchema = z.object({
  boxId: z.string(),
  docType: z.nativeEnum(DocType),
  docNumber: z.string().optional(),
  docDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val ? (typeof val === "string" ? new Date(val) : val) : undefined
  ),
  amount: z.coerce.number().min(0).optional(),
  vatAmount: z.coerce.number().min(0).optional(),
  foreignCurrency: z.string().optional(),
  foreignAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial().omit({ boxId: true });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ==================== Payment Validation ====================

export const createPaymentSchema = z.object({
  boxId: z.string(),
  amount: z.coerce.number().min(0.01, "ยอดเงินต้องมากกว่า 0"),
  paidDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === "string" ? new Date(val) : val
  ),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
  documentId: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial().omit({ boxId: true });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
