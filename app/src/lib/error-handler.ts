/**
 * Error Handling Utilities
 * Centralized error handling and logging for server actions
 */

import type { ApiResponse } from "@/types";
import { Prisma } from "@prisma/client";

/**
 * Wrap an async function with error handling
 * Automatically catches errors and returns ApiResponse format
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = "เกิดข้อผิดพลาด"
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    console.error(errorMessage, error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError) {
      const prismaError = handlePrismaError(error);
      return { success: false, error: prismaError };
    }
    
    // Handle standard errors
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle Prisma-specific errors and return user-friendly messages
 */
export function handlePrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "ข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง";
      case "P2025":
        return "ไม่พบข้อมูลที่ต้องการ";
      case "P2003":
        return "ข้อมูลที่เกี่ยวข้องไม่ถูกต้อง";
      case "P2014":
        return "ข้อมูลมีความเกี่ยวข้องกับข้อมูลอื่น ไม่สามารถลบได้";
      case "P2023":
        return "ข้อมูล Column ไม่ถูกต้อง";
      default:
        console.error("Unknown Prisma error code:", error.code);
        return `เกิดข้อผิดพลาดในฐานข้อมูล (${error.code})`;
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
  }
  
  return "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล";
}

/**
 * Log errors with context
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  console.error(`[${context}]`, error);
  if (additionalInfo) {
    console.error("Additional info:", additionalInfo);
  }
  
  // In production, send to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with error tracking service
  }
}
