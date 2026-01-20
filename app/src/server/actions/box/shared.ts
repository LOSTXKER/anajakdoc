"use server";

// Re-export common dependencies for box actions
export { default as prisma } from "@/lib/prisma";
export { requireOrganization } from "@/server/auth";
export { revalidatePath } from "next/cache";
export { redirect } from "next/navigation";
export { createNotification, notifyAccountingTeam } from "../notification";
export { createClient } from "@/lib/supabase/server";
export { calculateServerCompletionPercent, getAutoChecklistUpdates, determineDocStatus } from "@/lib/checklist";
export { createAutoPaymentFromSlip, recalculateBoxPaymentStatus } from "../payment-helpers";

// Re-export types
export type { ApiResponse, BoxFilters, PaginatedResponse, BoxWithRelations, DocType } from "@/types";
export { BoxStatus, DocStatus, PaymentStatus, ExpenseType } from "@prisma/client";

// Re-export crypto for file hashing
export { default as crypto } from "crypto";
