/**
 * Custom hooks for document management
 */

export { useDocumentSelection, default as useDocumentSelectionDefault } from "./use-document-selection";
export { useDocumentFilters, type TabValue } from "./use-document-filters";
export { useTaxCalculation, calculateVAT, calculateWHT, type AmountInputType } from "./use-tax-calculation";
export { useDocumentExtraction, default as useDocumentExtractionDefault } from "./use-document-extraction";
export { useAggregatedData, type AggregatedData, type AggregatedField, type FieldSource, type UserOverrides } from "./use-aggregated-data";
