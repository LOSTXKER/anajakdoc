/**
 * Standardized Error Messages
 * Consistent error messages across the application
 */

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
  NOT_LOGGED_IN: "กรุณาเข้าสู่ระบบ",
  NO_ORGANIZATION: "ไม่พบข้อมูล Organization",
  ADMIN_ONLY: "เฉพาะ Admin/Owner เท่านั้น",
  OWNER_ONLY: "เฉพาะ Owner เท่านั้น",
  ACCOUNTING_ONLY: "เฉพาะฝ่ายบัญชีเท่านั้น",
  
  // Data Operations
  NOT_FOUND: "ไม่พบข้อมูล",
  BOX_NOT_FOUND: "ไม่พบกล่องเอกสาร",
  DOCUMENT_NOT_FOUND: "ไม่พบเอกสาร",
  CONTACT_NOT_FOUND: "ไม่พบผู้ติดต่อ",
  CATEGORY_NOT_FOUND: "ไม่พบหมวดหมู่",
  USER_NOT_FOUND: "ไม่พบผู้ใช้งาน",
  ORGANIZATION_NOT_FOUND: "ไม่พบองค์กร",
  
  // Validation
  INVALID_INPUT: "ข้อมูลไม่ถูกต้อง",
  REQUIRED_FIELD: "กรุณากรอกข้อมูลที่จำเป็น",
  INVALID_EMAIL: "รูปแบบอีเมลไม่ถูกต้อง",
  INVALID_DATE: "วันที่ไม่ถูกต้อง",
  INVALID_AMOUNT: "จำนวนเงินไม่ถูกต้อง",
  
  // Box Operations
  BOX_NOT_EDITABLE: "ไม่สามารถแก้ไขกล่องในสถานะนี้",
  FISCAL_PERIOD_CLOSED: "งวดบัญชีปิดแล้ว ไม่สามารถแก้ไขได้",
  BOX_ALREADY_COMPLETED: "กล่องนี้เสร็จสิ้นแล้ว",
  INVALID_STATUS_TRANSITION: "ไม่สามารถเปลี่ยนสถานะได้",
  
  // File Operations
  FILE_TOO_LARGE: "ไฟล์ใหญ่เกินไป",
  INVALID_FILE_TYPE: "ประเภทไฟล์ไม่ถูกต้อง",
  UPLOAD_FAILED: "การอัปโหลดล้มเหลว",
  FILE_NOT_FOUND: "ไม่พบไฟล์",
  
  // Database
  DATABASE_ERROR: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
  DUPLICATE_ENTRY: "ข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง",
  FOREIGN_KEY_ERROR: "ข้อมูลที่เกี่ยวข้องไม่ถูกต้อง",
  CANNOT_DELETE: "ไม่สามารถลบได้ เนื่องจากมีข้อมูลที่เกี่ยวข้อง",
  
  // Firm Operations
  FIRM_NOT_FOUND: "ไม่พบสำนักงานบัญชี",
  NOT_FIRM_MEMBER: "คุณไม่ได้เป็นสมาชิกของสำนักงานบัญชี",
  FIRM_MANAGER_ONLY: "เฉพาะ Manager/Owner เท่านั้น",
  CLIENT_ALREADY_EXISTS: "Client นี้มีอยู่แล้ว",
  
  // Generic
  SOMETHING_WENT_WRONG: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  TIMEOUT: "หมดเวลาในการดำเนินการ",
} as const;

/**
 * Get error message with fallback
 */
export function getErrorMessage(
  key: keyof typeof ERROR_MESSAGES,
  fallback?: string
): string {
  return ERROR_MESSAGES[key] || fallback || ERROR_MESSAGES.SOMETHING_WENT_WRONG;
}
