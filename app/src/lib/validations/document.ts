import { z } from "zod";
import { TransactionType, DocType, PaymentMethod, DocumentStatus } from ".prisma/client";

export const createDocumentSchema = z.object({
  transactionType: z.nativeEnum(TransactionType).default(TransactionType.EXPENSE),
  // docType is now optional - actual doc types are in SubDocument
  docType: z.nativeEnum(DocType).optional().default(DocType.RECEIPT),
  docDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === "string" ? new Date(val) : val
  ),
  dueDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val ? (typeof val === "string" ? new Date(val) : val) : undefined
  ),
  subtotal: z.coerce.number().min(0),
  vatAmount: z.coerce.number().min(0).default(0),
  whtAmount: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  isVatInclusive: z.boolean().default(true),
  hasValidVat: z.boolean().default(false),
  hasWht: z.boolean().default(false),
  whtRate: z.coerce.number().min(0).max(100).optional(),
  whtType: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  externalRef: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  costCenterId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  status: z.nativeEnum(DocumentStatus).optional(),
});

export const submitDocumentSchema = z.object({
  documentId: z.string(),
});

export const reviewDocumentSchema = z.object({
  documentId: z.string(),
  action: z.enum(["approve", "reject", "need_info"]),
  comment: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
