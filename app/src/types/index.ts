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
  Task,
  BookingEntry,
  MemberRole,
  BoxStatus,
  BoxType,
  ExpenseType,
  DocStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentMode,
  ReimbursementStatus,
  DocType,
  VatDocStatus,
  WhtDocStatus,
  WhtType,
  WhtStatus,
  WhtSentMethod,
  TaskType,
  TaskStatus,
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
  PaymentMode,
  ReimbursementStatus,
  DocType,
  VatDocStatus,
  WhtDocStatus,
  WhtType,
  WhtStatus,
  WhtSentMethod,
  TaskType,
  TaskStatus,
} from "@prisma/client";

// ==========================================
// Document with files
// ==========================================
export type DocumentWithFiles = Document & {
  files: DocumentFile[];
};

// ==========================================
// Task types
// ==========================================
export type TaskWithAssignee = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
};

export type TaskWithBox = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  box: {
    id: string;
    boxNumber: string;
    title: string | null;
    totalAmount: number;
    boxDate: Date;
    contact: Contact | null;
  };
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
// BookingEntry types
// ==========================================
export type BookingEntryWithBoxes = BookingEntry & {
  boxes: BoxListItem[];
  bookedBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
};

// ==========================================
// Box with relations
// ==========================================
export type BoxWithRelations = Box & {
  documents: DocumentWithFiles[];     // เอกสารในกล่อง
  payments: Payment[];                // การจ่ายเงิน
  whtTrackings: WhtTrackingWithContact[];
  tasks: TaskWithAssignee[];          // Tasks
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  createdBy: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  vatVerifiedBy?: Pick<User, "id" | "name" | "avatarUrl"> | null;
  bookingEntry?: BookingEntry | null;
  linkedBox?: Box | null;
  comments: (Comment & { user: Pick<User, "id" | "name" | "avatarUrl"> })[];
  _count?: {
    documents: number;
    payments: number;
    comments: number;
    tasks: number;
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

// Serialized contact for client (dates and decimals converted)
export type SerializedContact = Omit<
  Contact,
  "defaultWhtRate" | "createdAt" | "updatedAt" | "lastUsedAt"
> & {
  defaultWhtRate: number | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type SerializedWhtTracking = Omit<
  WhtTrackingWithContact,
  "amount" | "rate" | "issuedDate" | "sentDate" | "receivedDate" | "dueDate" | "createdAt" | "updatedAt" | "contact"
> & {
  amount: number;
  rate: number | null;
  issuedDate: string | null;
  sentDate: string | null;
  receivedDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  contact: SerializedContact | null;
  box?: {
    id: string;
    boxNumber: string;
    title: string | null;
    totalAmount: number;
    boxDate: string;
  } | null;
};

export type SerializedTask = Omit<
  TaskWithAssignee,
  "dueDate" | "completedAt" | "lastReminderAt" | "escalatedAt" | "cancelledAt" | "createdAt" | "updatedAt"
> & {
  dueDate: string | null;
  completedAt: string | null;
  lastReminderAt: string | null;
  escalatedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedBox = Omit<
  BoxWithRelations,
  | "totalAmount" | "vatAmount" | "whtAmount" | "paidAmount" 
  | "vatRate" | "whtRate" | "foreignAmount" | "exchangeRate" 
  | "boxDate" | "dueDate" | "whtDueDate"
  | "vatVerifiedAt" | "submittedAt" | "reviewedAt" | "bookedAt" 
  | "exportedAt" | "archivedAt" | "lockedAt" | "createdAt" | "updatedAt" 
  | "documents" | "payments" | "whtTrackings" | "tasks" | "contact"
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
  whtDueDate: string | null;
  vatVerifiedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  bookedAt: string | null;
  exportedAt: string | null;
  archivedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact: SerializedContact | null;
  documents: SerializedDocument[];
  payments: SerializedPayment[];
  whtTrackings: SerializedWhtTracking[];
  tasks: SerializedTask[];
};

// Box list item (simplified for list views)
export type BoxListItem = {
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
  boxDate: Date;
  dueDate: Date | null;
  hasVat: boolean;
  hasWht: boolean;
  whtSent: boolean;
  vatDocStatus: VatDocStatus;
  whtDocStatus: WhtDocStatus;
  whtDueDate: Date | null;
  whtOverdue: boolean;
  possibleDuplicate: boolean;
  paymentMode: PaymentMode;
  reimbursementStatus: ReimbursementStatus | null;
  isLateDocs: boolean;
  description: string | null;
  notes: string | null;
  externalRef: string | null;
  organizationId: string;
  createdById: string;
  contactId: string | null;
  categoryId: string | null;
  costCenterId: string | null;
  bookingEntryId: string | null;
  exportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contact: Contact | null;
  costCenter: CostCenter | null;
  category: Category | null;
  createdBy: { id: string; name: string | null; email: string; avatarUrl: string | null };
  documents: DocumentWithFiles[];
  _count?: { documents: number; payments: number; comments: number; tasks: number };
};

// Serialized box list item for client
export type SerializedBoxListItem = Omit<
  BoxListItem,
  "boxDate" | "dueDate" | "whtDueDate" | "exportedAt" | "createdAt" | "updatedAt" | "documents" | "contact"
> & {
  boxDate: string;
  dueDate: string | null;
  whtDueDate: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: SerializedDocument[];
  contact: SerializedContact | null;
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
  whtDueDate?: Date;
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
  paymentMode?: PaymentMode;
};

export type UpdateBoxInput = Partial<CreateBoxInput> & {
  status?: BoxStatus;
  docStatus?: DocStatus;
  paymentStatus?: PaymentStatus;
  vatDocStatus?: VatDocStatus;
  whtDocStatus?: WhtDocStatus;
  possibleDuplicate?: boolean;
  duplicateReason?: string;
  reimbursementStatus?: ReimbursementStatus;
  isLateDocs?: boolean;
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
  isLateDocs?: boolean;
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
  dueDate?: Date;
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
  isOverdue?: boolean;
};

export type CreateTaskInput = {
  boxId: string;
  taskType: TaskType;
  title: string;
  description?: string;
  dueDate?: Date;
  assigneeId?: string;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "boxId">> & {
  status?: TaskStatus;
  cancelReason?: string;
};

export type CreateBookingEntryInput = {
  boxIds: string[];
  description?: string;
  exportProfile?: string;
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
  // Accounting Firm membership (Section 22)
  firmMembership?: {
    firmId: string;
    firmName: string;
    firmSlug: string;
    role: string;
  } | null;
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
  vatDocStatus?: VatDocStatus[];
  whtDocStatus?: WhtDocStatus[];
  categoryId?: string;
  costCenterId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  hasWht?: boolean;
  whtOverdue?: boolean;
  possibleDuplicate?: boolean;
  paymentMode?: PaymentMode;
  reimbursementStatus?: ReimbursementStatus;
  // Aging buckets (days)
  agingBucket?: "0-3" | "4-7" | "8-14" | "15+";
};

export type TaskFilters = {
  status?: TaskStatus[];
  taskType?: TaskType[];
  assigneeId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  escalationLevel?: number;
  overdue?: boolean;
};

// ==========================================
// Dashboard Stats types
// ==========================================
export type OwnerDashboardStats = {
  totalPendingBoxes: number;
  totalPendingAmount: number;
  whtOutstanding: number;
  whtOverdueCount: number;
  whtOverdueAmount: number;
  possibleDuplicateCount: number;
  reimbursementPending: number;
  agingBuckets: {
    "0-3": number;
    "4-7": number;
    "8-14": number;
    "15+": number;
  };
};

export type AccountantDashboardStats = {
  inbox: number;           // SUBMITTED
  needMoreDocs: number;    // NEED_MORE_DOCS
  readyToBook: number;     // READY_TO_BOOK
  whtPending: number;      // WHT_PENDING
  overdueWht: number;      // WHT overdue tasks
  overdueTasks: number;    // All overdue tasks
};

// ==========================================
// Organization role type
// ==========================================
export type OrganizationRole = MemberRole;

// ==========================================
// Status transition types
// ==========================================
// Note: Status transitions are now defined in @/lib/config/status-transitions.ts
// Using simplified 4-status system: DRAFT → PENDING → COMPLETED
//                                         ↓ ↑
//                                    NEED_DOCS
