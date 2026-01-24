/**
 * Centralized document configuration (V3)
 * 
 * This file re-exports from modular config files for backward compatibility.
 * For new code, prefer importing directly from @/lib/config
 * 
 * Example:
 *   import { BOX_TYPE_CONFIG } from "@/lib/config";
 *   // or
 *   import { BOX_TYPE_CONFIG } from "@/lib/config/box-type-config";
 */

// Re-export everything from config modules
export * from "./config";
