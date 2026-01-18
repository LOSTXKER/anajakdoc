import type { 
  Organization, 
  User, 
  Document, 
  DocumentFile, 
  Contact, 
  CostCenter, 
  Category,
  Comment,
  MemberRole,
  DocumentStatus,
  TransactionType,
  DocType,
  PaymentMethod,
  PaymentStatus
} from ".prisma/client";

// Re-export enums for convenience
export { 
  MemberRole, 
  DocumentStatus, 
  TransactionType, 
  DocType, 
  PaymentMethod,
  PaymentStatus
};

// Extended types with relations
export type DocumentWithRelations = Document & {
  files: DocumentFile[];
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  submittedBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  reviewedBy: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  comments: (Comment & { user: Pick<User, "id" | "name" | "avatarUrl"> })[];
  _count?: {
    files: number;
    comments: number;
  };
};

// Serialized version for Client Components (Decimal -> number)
export type SerializedDocument = Omit<
  DocumentWithRelations,
  "subtotal" | "vatAmount" | "whtAmount" | "totalAmount" | "vatRate" | "whtRate" | "docDate" | "dueDate" | "submittedAt" | "reviewedAt" | "exportedAt" | "bookedAt" | "createdAt" | "updatedAt"
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
  docType: DocType;
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
  categoryId?: string;
  costCenterId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};
