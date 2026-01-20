// Import types (models)
import type { 
  Organization, 
  User, 
  Box,
  Document,
  DocumentFile,
  Payment,
  WhtTracking,
  Contact, 
  CostCenter, 
  Category,
  Comment,
  MemberRole,
  BoxStatus,
  BoxType,
  ExpenseType,
  DocStatus,
  PaymentStatus,
  PaymentMethod,
  DocType,
  WhtType,
  WhtStatus,
  WhtSentMethod,
} from "@prisma/client";

// Re-export enums as types
export type {
  MemberRole,
  BoxStatus,
  BoxType,
  ExpenseType,
  DocStatus,
  PaymentStatus,
  PaymentMethod,
  DocType,
  WhtType,
  WhtStatus,
  WhtSentMethod,
} from "@prisma/client";

// ==========================================
// Document with files
// ==========================================
export type DocumentWithFiles = Document & {
  files: DocumentFile[];
};

// ==========================================
// WHT Tracking types
// ==========================================
export type WhtTrackingWithContact = WhtTracking & {
  contact: Contact | null;
};

export type WhtTrackingWithBox = WhtTracking & {
  contact: Contact | null;
  box: {
    id: string;
    boxNumber: string;
    title: string | null;
    totalAmount: number;
    boxDate: Date;
  } | null;
};

// ==========================================
// Payment types
// ==========================================
export type PaymentWithDocument = Payment & {
  document?: Document | null;
};

// ==========================================
// Box with relations
// ==========================================
export type BoxWithRelations = Box & {
  documents: DocumentWithFiles[];     // เอกสารในกล่อง
  payments: Payment[];                // การจ่ายเงิน
  whtTrackings: WhtTrackingWithContact[];
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  createdBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  linkedBox?: Box | null;
  comments: (Comment & { user: Pick<User, "id" | "name" | "avatarUrl"> })[];
  _count?: {
    documents: number;
    payments: number;
    comments: number;
  };
};

// ==========================================
// Serialized types for Client Components
// ==========================================

export type SerializedDocument = Omit<
  DocumentWithFiles,
  "amount" | "vatAmount" | "foreignAmount" | "docDate" | "createdAt" | "updatedAt"
> & {
  amount: number | null;
  vatAmount: number | null;
  foreignAmount: number | null;
  docDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedPayment = Omit<
  Payment,
  "amount" | "paidDate" | "createdAt"
> & {
  amount: number;
  paidDate: string;
  createdAt: string;
};

export type SerializedWhtTracking = Omit<
  WhtTrackingWithContact,
  "amount" | "rate" | "issuedDate" | "sentDate" | "receivedDate" | "createdAt" | "updatedAt"
> & {
  amount: number;
  rate: number | null;
  issuedDate: string | null;
  sentDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  updatedAt: string;
  box?: {
    id: string;
    boxNumber: string;
    title: string | null;
    totalAmount: number;
    boxDate: string;
  } | null;
};

export type SerializedBox = Omit<
  BoxWithRelations,
  "totalAmount" | "vatAmount" | "whtAmount" | "paidAmount" | "vatRate" | "whtRate" | "foreignAmount" | "exchangeRate" | "boxDate" | "dueDate" | "exportedAt" | "createdAt" | "updatedAt" | "documents" | "payments" | "whtTrackings"
> & {
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  paidAmount: number;
  vatRate: number | null;
  whtRate: number | null;
  foreignAmount: number | null;
  exchangeRate: number | null;
  boxDate: string;
  dueDate: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: SerializedDocument[];
  payments: SerializedPayment[];
  whtTrackings: SerializedWhtTracking[];
};

// Simplified box type for list views
export type SerializedBoxListItem = {
  id: string;
  boxNumber: string;
  title: string | null;
  boxType: BoxType;
  expenseType: ExpenseType | null;
  status: BoxStatus;
  docStatus: DocStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  paidAmount: number;
  boxDate: string;
  dueDate: string | null;
  hasVat: boolean;
  hasWht: boolean;
  whtSent: boolean;
  description: string | null;
  notes: string | null;
  externalRef: string | null;
  organizationId: string;
  createdById: string;
  contactId: string | null;
  categoryId: string | null;
  costCenterId: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  createdBy: { id: string; name: string | null; email: string; avatarUrl: string | null };
  documents: SerializedDocument[];
  _count?: { documents: number; payments: number; comments: number };
};

// ==========================================
// Organization types
// ==========================================
export type OrganizationWithMember = Organization & {
  members: {
    role: MemberRole;
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  }[];
};

// ==========================================
// Form input types
// ==========================================
export type CreateBoxInput = {
  boxType: BoxType;
  expenseType?: ExpenseType;
  boxDate: Date;
  dueDate?: Date;
  totalAmount?: number;
  vatAmount?: number;
  whtAmount?: number;
  vatRate?: number;
  isVatInclusive?: boolean;
  hasVat?: boolean;
  hasWht?: boolean;
  whtRate?: number;
  foreignCurrency?: string;
  foreignAmount?: number;
  exchangeRate?: number;
  noReceiptReason?: string;
  externalRef?: string;
  title?: string;
  description?: string;
  notes?: string;
  contactId?: string;
  costCenterId?: string;
  categoryId?: string;
};

export type UpdateBoxInput = Partial<CreateBoxInput> & {
  status?: BoxStatus;
  docStatus?: DocStatus;
  paymentStatus?: PaymentStatus;
};

export type CreateDocumentInput = {
  boxId: string;
  docType: DocType;
  docNumber?: string;
  docDate?: Date;
  amount?: number;
  vatAmount?: number;
  foreignCurrency?: string;
  foreignAmount?: number;
  notes?: string;
};

export type UpdateDocumentInput = Partial<Omit<CreateDocumentInput, "boxId">>;

export type CreatePaymentInput = {
  boxId: string;
  amount: number;
  paidDate: Date;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  documentId?: string;
};

export type CreateWhtTrackingInput = {
  boxId: string;
  type: WhtType;
  amount: number;
  rate?: number;
  contactId?: string;
  notes?: string;
};

export type UpdateWhtTrackingInput = Partial<Omit<CreateWhtTrackingInput, "boxId" | "type">> & {
  status?: WhtStatus;
  issuedDate?: Date;
  sentDate?: Date;
  sentMethod?: WhtSentMethod;
  receivedDate?: Date;
  documentId?: string;
};

// ==========================================
// Session types
// ==========================================
export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  currentOrganization: {
    id: string;
    name: string;
    slug: string;
    role: MemberRole;
  } | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
    role: MemberRole;
  }[];
};

// ==========================================
// API Response types
// ==========================================
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ==========================================
// Filter types
// ==========================================
export type BoxFilters = {
  status?: BoxStatus[];
  boxType?: BoxType;
  expenseType?: ExpenseType[];
  docStatus?: DocStatus[];
  docType?: DocType[];
  paymentStatus?: PaymentStatus[];
  categoryId?: string;
  costCenterId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  hasWht?: boolean;
};

// ==========================================
// Organization role type
// ==========================================
export type OrganizationRole = MemberRole;
