import type { 
  Organization, 
  User, 
  Document, 
  DocumentFile, 
  SubDocument,
  SubDocumentFile,
  WHTTracking,
  Contact, 
  CostCenter, 
  Category,
  Comment,
  MemberRole,
  DocumentStatus,
  TransactionType,
  DocType,
  SubDocType,
  OcrStatus,
  PaymentMethod,
  PaymentStatus,
  WHTTrackingType,
  WHTStatus,
  WHTSentMethod
} from ".prisma/client";

// Re-export enums for convenience
export { 
  MemberRole, 
  DocumentStatus, 
  TransactionType, 
  DocType,
  SubDocType,
  OcrStatus,
  PaymentMethod,
  PaymentStatus,
  WHTTrackingType,
  WHTStatus,
  WHTSentMethod
};

// SubDocument with files
export type SubDocumentWithFiles = SubDocument & {
  files: SubDocumentFile[];
};

// WHT Tracking with contact (for document relations)
export type WHTTrackingWithContact = WHTTracking & {
  contact: Contact | null;
};

// WHT Tracking with document (for WHT tracking list)
export type WHTTrackingWithDocument = WHTTracking & {
  contact: Contact | null;
  document: {
    id: string;
    docNumber: string;
    description: string | null;
    totalAmount: number;
    docDate: Date;
  } | null;
};

// Extended types with relations
export type DocumentWithRelations = Document & {
  files: DocumentFile[];           // Legacy files
  subDocuments: SubDocumentWithFiles[];  // NEW: เอกสารในกล่อง
  whtTrackings: WHTTrackingWithContact[]; // NEW: WHT tracking
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  submittedBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  reviewedBy: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  comments: (Comment & { user: Pick<User, "id" | "name" | "avatarUrl"> })[];
  _count?: {
    files: number;
    subDocuments: number;
    comments: number;
  };
};

// Serialized SubDocument for Client Components
export type SerializedSubDocument = Omit<
  SubDocumentWithFiles,
  "amount" | "vatAmount" | "docDate" | "createdAt" | "updatedAt"
> & {
  amount: number | null;
  vatAmount: number | null;
  docDate: string | null;
  createdAt: string;
  updatedAt: string;
};

// Serialized WHT Tracking for Client Components
export type SerializedWHTTracking = Omit<
  WHTTrackingWithContact,
  "whtAmount" | "whtRate" | "issuedDate" | "sentDate" | "confirmedDate" | "receivedDate" | "createdAt" | "updatedAt"
> & {
  whtAmount: number;
  whtRate: number;
  issuedDate: string | null;
  sentDate: string | null;
  confirmedDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    docNumber: string;
    description: string | null;
    totalAmount: number;
    docDate: string;
  } | null;
};

// Serialized version for Client Components (Decimal -> number)
export type SerializedDocument = Omit<
  DocumentWithRelations,
  "subtotal" | "vatAmount" | "whtAmount" | "totalAmount" | "vatRate" | "whtRate" | "docDate" | "dueDate" | "submittedAt" | "reviewedAt" | "exportedAt" | "bookedAt" | "createdAt" | "updatedAt" | "subDocuments" | "whtTrackings"
> & {
  subtotal: number;
  vatAmount: number;
  whtAmount: number;
  totalAmount: number;
  vatRate: number | null;
  whtRate: number | null;
  docDate: string;
  dueDate: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  exportedAt: string | null;
  bookedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subDocuments: SerializedSubDocument[];
  whtTrackings: SerializedWHTTracking[];
};

// Simplified document type for list views (without all relations)
export type SerializedDocumentListItem = {
  id: string;
  docNumber: string;
  transactionType: TransactionType;
  docType: DocType | null;
  status: DocumentStatus;
  subtotal: number;
  vatAmount: number;
  whtAmount: number;
  totalAmount: number;
  vatRate: number | null;
  whtRate: number | null;
  docDate: string;
  dueDate: string | null;
  description: string | null;
  notes: string | null;
  externalRef: string | null;
  organizationId: string;
  submittedById: string;
  reviewedById: string | null;
  contactId: string | null;
  categoryId: string | null;
  costCenterId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  exportedAt: string | null;
  bookedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isPaid: boolean;
  hasPaymentProof: boolean;
  hasTaxInvoice: boolean;
  hasInvoice: boolean;
  whtIssued: boolean;
  whtSent: boolean;
  whtReceived: boolean;
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  submittedBy: { id: string; name: string | null; email: string; avatarUrl: string | null };
  subDocuments: SerializedSubDocument[];
  _count?: { files: number; subDocuments: number; comments: number };
};

export type OrganizationWithMember = Organization & {
  members: {
    role: MemberRole;
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  }[];
};

// Form types
export type CreateDocumentInput = {
  transactionType: TransactionType;
  docType?: DocType;
  docDate: Date;
  dueDate?: Date;
  subtotal: number;
  vatAmount?: number;
  whtAmount?: number;
  totalAmount: number;
  vatRate?: number;
  isVatInclusive?: boolean;
  hasWht?: boolean;
  whtRate?: number;
  whtType?: string;
  paymentMethod?: PaymentMethod;
  externalRef?: string;
  description?: string;
  notes?: string;
  contactId?: string;
  costCenterId?: string;
  categoryId?: string;
};

export type UpdateDocumentInput = Partial<CreateDocumentInput> & {
  status?: DocumentStatus;
  isComplete?: boolean;
};

// SubDocument input
export type CreateSubDocumentInput = {
  documentId: string;
  docType: SubDocType;
  docNumber?: string;
  docDate?: Date;
  amount?: number;
  vatAmount?: number;
  notes?: string;
};

export type UpdateSubDocumentInput = Partial<Omit<CreateSubDocumentInput, "documentId">>;

// WHT Tracking input
export type CreateWHTTrackingInput = {
  documentId: string;
  trackingType: WHTTrackingType;
  whtAmount: number;
  whtRate: number;
  contactId?: string;
  counterpartyName?: string;
  notes?: string;
};

export type UpdateWHTTrackingInput = Partial<Omit<CreateWHTTrackingInput, "documentId" | "trackingType">> & {
  status?: WHTStatus;
  issuedDate?: Date;
  sentDate?: Date;
  sentMethod?: WHTSentMethod;
  confirmedDate?: Date;
  receivedDate?: Date;
  fileUrl?: string;
};

// Session types
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

// API Response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Filter types
export type DocumentFilters = {
  status?: DocumentStatus[];
  transactionType?: TransactionType;
  docType?: DocType[];
  subDocType?: SubDocType[];
  paymentStatus?: PaymentStatus[];
  categoryId?: string;
  costCenterId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  hasWht?: boolean;
  isComplete?: boolean;
};

// Organization role type
export type OrganizationRole = MemberRole;
