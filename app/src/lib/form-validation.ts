/**
 * FormData validation helpers
 * Provides type-safe extraction of form data with validation
 */

export class FormValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = "FormValidationError";
  }
}

/**
 * Get required string from FormData
 * Returns the string value or null if missing/empty
 */
export function getRequiredString(
  formData: FormData,
  key: string
): string | null {
  const value = formData.get(key);
  
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value !== "string") {
    return null;
  }
  
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Get optional string from FormData
 */
export function getOptionalString(
  formData: FormData,
  key: string,
  defaultValue: string | null = null
): string | null {
  const value = formData.get(key);
  
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  
  if (typeof value !== "string") {
    return defaultValue;
  }
  
  return value.trim() || defaultValue;
}

/**
 * Get required number from FormData
 */
export function getRequiredNumber(
  formData: FormData,
  key: string
): number | null {
  const value = formData.get(key);
  
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get optional number from FormData
 */
export function getOptionalNumber(
  formData: FormData,
  key: string,
  defaultValue: number | null = null
): number | null {
  const value = getRequiredNumber(formData, key);
  return value !== null ? value : defaultValue;
}

/**
 * Get boolean from FormData
 */
export function getBoolean(
  formData: FormData,
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = formData.get(key);
  
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === "boolean") {
    return value;
  }
  
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "on") {
      return true;
    }
    if (lower === "false" || lower === "0" || lower === "off" || lower === "") {
      return false;
    }
  }
  
  return defaultValue;
}

/**
 * Get date from FormData
 */
export function getDate(
  formData: FormData,
  key: string
): Date | null {
  const value = formData.get(key);
  
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const parsed = new Date(value as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Get File from FormData
 */
export function getFile(
  formData: FormData,
  key: string
): File | null {
  const value = formData.get(key);
  
  if (!(value instanceof File)) {
    return null;
  }
  
  // Check if it's actually a file (not empty)
  if (value.size === 0) {
    return null;
  }
  
  return value;
}

/**
 * Get all files from FormData
 */
export function getFiles(
  formData: FormData,
  key: string
): File[] {
  const values = formData.getAll(key);
  
  return values.filter((v): v is File => 
    v instanceof File && v.size > 0
  );
}

/**
 * Validate required fields
 * Throws FormValidationError if any field is missing
 */
export function validateRequired(
  formData: FormData,
  fields: string[]
): void {
  for (const field of fields) {
    const value = getRequiredString(formData, field);
    if (value === null) {
      throw new FormValidationError(
        `กรุณากรอก ${field}`,
        field
      );
    }
  }
}

/**
 * Extract form data with validation
 * Provides a typed way to extract and validate form data
 */
export function extractFormData<T extends Record<string, unknown>>(
  formData: FormData,
  schema: Record<string, {
    type: "string" | "number" | "boolean" | "date" | "file" | "files";
    required?: boolean;
    default?: unknown;
  }>
): Partial<T> {
  const result: Record<string, unknown> = {};
  
  for (const [key, config] of Object.entries(schema)) {
    let value: unknown;
    
    switch (config.type) {
      case "string":
        value = config.required 
          ? getRequiredString(formData, key)
          : getOptionalString(formData, key, (config.default as string | null | undefined) ?? null);
        break;
      case "number":
        value = config.required
          ? getRequiredNumber(formData, key)
          : getOptionalNumber(formData, key, (config.default as number | null | undefined) ?? null);
        break;
      case "boolean":
        value = getBoolean(formData, key, (config.default as boolean | undefined) ?? false);
        break;
      case "date":
        value = getDate(formData, key);
        break;
      case "file":
        value = getFile(formData, key);
        break;
      case "files":
        value = getFiles(formData, key);
        break;
    }
    
    if (config.required && (value === null || value === undefined)) {
      throw new FormValidationError(`กรุณากรอก ${key}`, key);
    }
    
    result[key] = value;
  }
  
  return result as Partial<T>;
}
