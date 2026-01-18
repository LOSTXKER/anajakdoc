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

// WHT Tracking with contact
export type WHTTrackingWithContact = WHTTracking & {
  contact: Contact | null;
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
  vatRate: number;
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
  categoryId?: string;
  costCenterId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  hasWht?: boolean;
  isComplete?: boolean;
};
