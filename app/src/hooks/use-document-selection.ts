"use client";

import { useState, useCallback, useMemo } from "react";

interface SelectableItem {
  id: string;
}

interface UseDocumentSelectionResult<T extends SelectableItem> {
  /** Set of selected document IDs */
  selectedIds: Set<string>;
  /** Handle single item selection */
  handleSelect: (id: string, checked: boolean) => void;
  /** Handle select all items */
  handleSelectAll: (checked: boolean) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if all items are selected */
  allSelected: boolean;
  /** Check if some items are selected */
  someSelected: boolean;
  /** Number of selected items */
  selectedCount: number;
  /** Check if a specific item is selected */
  isSelected: (id: string) => boolean;
  /** Get selected items */
  getSelectedItems: () => T[];
}

/**
 * Hook สำหรับจัดการ selection state ของ documents
 * ใช้แทน logic ที่ซ้ำกันใน unified-document-view, document-management, document-list
 */
export function useDocumentSelection<T extends SelectableItem>(
  documents: T[]
): UseDocumentSelectionResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(documents.map((d) => d.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [documents]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const getSelectedItems = useCallback(
    () => documents.filter((d) => selectedIds.has(d.id)),
    [documents, selectedIds]
  );

  const allSelected = useMemo(
    () => documents.length > 0 && documents.every((d) => selectedIds.has(d.id)),
    [documents, selectedIds]
  );

  const someSelected = useMemo(() => selectedIds.size > 0, [selectedIds]);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    selectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    allSelected,
    someSelected,
    selectedCount,
    isSelected,
    getSelectedItems,
  };
}

export default useDocumentSelection;
