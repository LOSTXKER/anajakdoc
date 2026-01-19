"use client";

import { useMemo } from "react";
import type { ExtractedFile } from "@/components/documents/document-file-card";

/** Source information for a field value */
export interface FieldSource {
  fileId: string;
  fileName: string;
  confidence: number;
}

/** Aggregated field with possible conflict */
export interface AggregatedField<T> {
  /** Primary value (highest confidence or first) */
  value: T | undefined;
  /** All sources that provide this field */
  sources: FieldSource[];
  /** Whether there are conflicting values */
  hasConflict: boolean;
  /** All different values found */
  allValues: { value: T; source: FieldSource }[];
  /** Whether user has manually overridden this value */
  isUserEdited: boolean;
}

/** Complete aggregated data from all files */
export interface AggregatedData {
  amount: AggregatedField<number>;
  vatAmount: AggregatedField<number>;
  description: AggregatedField<string>;
  contactName: AggregatedField<string>;
  documentDate: AggregatedField<string>;
  documentNumber: AggregatedField<string>;
  taxId: AggregatedField<string>;
  docType: AggregatedField<string>;
  hasVat: boolean;
}

/** User overrides for aggregated fields */
export interface UserOverrides {
  amount?: number;
  vatAmount?: number;
  description?: string;
  contactName?: string;
  documentDate?: string;
  documentNumber?: string;
  taxId?: string;
  docType?: string;
}

interface UseAggregatedDataOptions {
  /** Files to aggregate */
  files: ExtractedFile[];
  /** User's manual overrides */
  userOverrides?: UserOverrides;
  /** Fields that user has edited */
  editedFields?: Set<string>;
}

/** Keys of AggregatedData that are AggregatedField (not hasVat) */
type AggregatedFieldKeys = Exclude<keyof AggregatedData, "hasVat">;

interface UseAggregatedDataReturn {
  /** Aggregated data from all files */
  data: AggregatedData;
  /** Whether there are any conflicts */
  hasConflicts: boolean;
  /** List of conflicting field names */
  conflictingFields: string[];
  /** Get the final value for a field (considering user overrides) */
  getFinalValue: <K extends AggregatedFieldKeys>(field: K) => AggregatedData[K]["value"];
  /** Check if a specific field has conflicts */
  hasFieldConflict: (field: AggregatedFieldKeys) => boolean;
}

/**
 * Tolerance for comparing amounts (to handle floating point issues)
 */
const AMOUNT_TOLERANCE = 0.5;

/**
 * Check if two amounts are effectively the same
 */
function amountsAreEqual(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return Math.abs(a - b) < AMOUNT_TOLERANCE;
}

/**
 * Check if two strings are effectively the same
 */
function stringsAreEqual(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Create an empty aggregated field
 */
function createEmptyField<T>(): AggregatedField<T> {
  return {
    value: undefined,
    sources: [],
    hasConflict: false,
    allValues: [],
    isUserEdited: false,
  };
}

/**
 * Hook to aggregate data from multiple extracted files
 * Detects conflicts and provides source tracking
 */
export function useAggregatedData({
  files,
  userOverrides = {},
  editedFields = new Set(),
}: UseAggregatedDataOptions): UseAggregatedDataReturn {
  const data = useMemo(() => {
    // Initialize empty fields
    const result: AggregatedData = {
      amount: createEmptyField<number>(),
      vatAmount: createEmptyField<number>(),
      description: createEmptyField<string>(),
      contactName: createEmptyField<string>(),
      documentDate: createEmptyField<string>(),
      documentNumber: createEmptyField<string>(),
      taxId: createEmptyField<string>(),
      docType: createEmptyField<string>(),
      hasVat: false,
    };

    // Only process files that have been successfully analyzed
    const analyzedFiles = files.filter(f => f.status === "done" && f.extractedData);

    // Process each file and collect values
    for (const file of analyzedFiles) {
      const { extractedData, id, file: fileObj } = file;
      if (!extractedData) continue;

      const source: FieldSource = {
        fileId: id,
        fileName: fileObj.name,
        confidence: extractedData.confidence || 0,
      };

      // Amount
      if (extractedData.amount !== undefined) {
        result.amount.sources.push(source);
        result.amount.allValues.push({ value: extractedData.amount, source });
      }

      // VAT Amount
      if (extractedData.vatAmount !== undefined && extractedData.vatAmount > 0) {
        result.vatAmount.sources.push(source);
        result.vatAmount.allValues.push({ value: extractedData.vatAmount, source });
        result.hasVat = true;
      }

      // Description
      if (extractedData.description) {
        result.description.sources.push(source);
        result.description.allValues.push({ value: extractedData.description, source });
      }

      // Contact Name
      if (extractedData.contactName) {
        result.contactName.sources.push(source);
        result.contactName.allValues.push({ value: extractedData.contactName, source });
      }

      // Document Date
      if (extractedData.documentDate) {
        result.documentDate.sources.push(source);
        result.documentDate.allValues.push({ value: extractedData.documentDate, source });
      }

      // Document Number
      if (extractedData.documentNumber) {
        result.documentNumber.sources.push(source);
        result.documentNumber.allValues.push({ value: extractedData.documentNumber, source });
      }

      // Tax ID
      if (extractedData.taxId) {
        result.taxId.sources.push(source);
        result.taxId.allValues.push({ value: extractedData.taxId, source });
      }

      // Doc Type
      if (extractedData.type) {
        result.docType.sources.push(source);
        result.docType.allValues.push({ value: extractedData.type, source });
      }
    }

    // Detect conflicts and set primary values
    
    // Amount - check for significant differences
    if (result.amount.allValues.length > 0) {
      // Sort by confidence
      const sorted = [...result.amount.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.amount.value = sorted[0].value;
      
      // Check for conflicts
      const uniqueAmounts = result.amount.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => amountsAreEqual(a.value, v.value))
      );
      result.amount.hasConflict = uniqueAmounts.length > 1;
    }
    result.amount.isUserEdited = editedFields.has("amount");

    // VAT Amount
    if (result.vatAmount.allValues.length > 0) {
      const sorted = [...result.vatAmount.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.vatAmount.value = sorted[0].value;
      
      const uniqueVats = result.vatAmount.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => amountsAreEqual(a.value, v.value))
      );
      result.vatAmount.hasConflict = uniqueVats.length > 1;
    }
    result.vatAmount.isUserEdited = editedFields.has("vatAmount");

    // Description
    if (result.description.allValues.length > 0) {
      const sorted = [...result.description.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.description.value = sorted[0].value;
      
      const uniqueDescs = result.description.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => stringsAreEqual(a.value, v.value))
      );
      result.description.hasConflict = uniqueDescs.length > 1;
    }
    result.description.isUserEdited = editedFields.has("description");

    // Contact Name
    if (result.contactName.allValues.length > 0) {
      const sorted = [...result.contactName.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.contactName.value = sorted[0].value;
      
      const uniqueNames = result.contactName.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => stringsAreEqual(a.value, v.value))
      );
      result.contactName.hasConflict = uniqueNames.length > 1;
    }
    result.contactName.isUserEdited = editedFields.has("contactName");

    // Document Date
    if (result.documentDate.allValues.length > 0) {
      const sorted = [...result.documentDate.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.documentDate.value = sorted[0].value;
      
      const uniqueDates = result.documentDate.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => a.value === v.value)
      );
      result.documentDate.hasConflict = uniqueDates.length > 1;
    }
    result.documentDate.isUserEdited = editedFields.has("documentDate");

    // Document Number
    if (result.documentNumber.allValues.length > 0) {
      const sorted = [...result.documentNumber.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.documentNumber.value = sorted[0].value;
      
      // Document numbers from different files are expected to be different (not a conflict)
      result.documentNumber.hasConflict = false;
    }
    result.documentNumber.isUserEdited = editedFields.has("documentNumber");

    // Tax ID
    if (result.taxId.allValues.length > 0) {
      const sorted = [...result.taxId.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
      result.taxId.value = sorted[0].value;
      
      const uniqueTaxIds = result.taxId.allValues.filter((v, i, arr) => 
        i === arr.findIndex(a => a.value === v.value)
      );
      result.taxId.hasConflict = uniqueTaxIds.length > 1;
    }
    result.taxId.isUserEdited = editedFields.has("taxId");

    // Doc Type
    if (result.docType.allValues.length > 0) {
      // For doc type, prefer TAX_INVOICE if available
      const taxInvoice = result.docType.allValues.find(v => v.value === "TAX_INVOICE");
      if (taxInvoice) {
        result.docType.value = taxInvoice.value;
      } else {
        const sorted = [...result.docType.allValues].sort((a, b) => b.source.confidence - a.source.confidence);
        result.docType.value = sorted[0].value;
      }
      // Different doc types are expected (not a conflict)
      result.docType.hasConflict = false;
    }
    result.docType.isUserEdited = editedFields.has("docType");

    return result;
  }, [files, editedFields]);

  // Check for any conflicts
  const hasConflicts = useMemo(() => {
    return (
      data.amount.hasConflict ||
      data.vatAmount.hasConflict ||
      data.description.hasConflict ||
      data.contactName.hasConflict ||
      data.documentDate.hasConflict ||
      data.taxId.hasConflict
    );
  }, [data]);

  // Get conflicting field names
  const conflictingFields = useMemo(() => {
    const fields: string[] = [];
    if (data.amount.hasConflict) fields.push("amount");
    if (data.vatAmount.hasConflict) fields.push("vatAmount");
    if (data.description.hasConflict) fields.push("description");
    if (data.contactName.hasConflict) fields.push("contactName");
    if (data.documentDate.hasConflict) fields.push("documentDate");
    if (data.taxId.hasConflict) fields.push("taxId");
    return fields;
  }, [data]);

  // Get final value considering user overrides
  const getFinalValue = <K extends AggregatedFieldKeys>(field: K): AggregatedData[K]["value"] => {
    const override = userOverrides[field as keyof UserOverrides];
    if (override !== undefined) {
      return override as AggregatedData[K]["value"];
    }
    return (data[field] as AggregatedField<string | number>).value as AggregatedData[K]["value"];
  };

  // Check if a specific field has conflicts
  const hasFieldConflict = (field: AggregatedFieldKeys): boolean => {
    return (data[field] as AggregatedField<string | number>).hasConflict;
  };

  return {
    data,
    hasConflicts,
    conflictingFields,
    getFinalValue,
    hasFieldConflict,
  };
}

export default useAggregatedData;
