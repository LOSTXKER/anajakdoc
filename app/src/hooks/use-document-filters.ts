"use client";

import { useMemo } from "react";
import type { BoxStatus, DocStatus } from "@/types";

interface FilterableBox {
  id: string;
  status: BoxStatus | string;
  docStatus: DocStatus | string;
  createdById?: string;
}

interface UseBoxFiltersResult<T extends FilterableBox> {
  /** Boxes created by current user */
  myBoxes: T[];
  /** Boxes pending review (PENDING, NEED_DOCS) */
  pendingBoxes: T[];
  /** Boxes with incomplete documents */
  incompleteBoxes: T[];
  /** Completed boxes (COMPLETED) */
  doneBoxes: T[];
  /** Draft boxes */
  draftBoxes: T[];
  /** Get boxes for a specific tab */
  getBoxesForTab: (tab: TabValue) => T[];
  /** Box counts */
  counts: {
    myBoxes: number;
    pendingBoxes: number;
    incompleteBoxes: number;
    doneBoxes: number;
    draftBoxes: number;
    total: number;
  };
}

export type TabValue = "mine" | "pending" | "incomplete" | "done" | "draft" | "all";

/**
 * Hook สำหรับ filter boxes ตาม status และ user
 */
export function useBoxFilters<T extends FilterableBox>(
  boxes: T[],
  userId?: string
): UseBoxFiltersResult<T> {
  const myBoxes = useMemo(
    () => (userId ? boxes.filter((b) => b.createdById === userId) : []),
    [boxes, userId]
  );

  // Using new 5-status system: DRAFT, PREPARING, SUBMITTED, NEED_DOCS, COMPLETED
  const pendingBoxes = useMemo(
    () =>
      boxes.filter((b) =>
        ["SUBMITTED", "NEED_DOCS"].includes(b.status)
      ),
    [boxes]
  );

  const incompleteBoxes = useMemo(
    () => boxes.filter((b) => b.docStatus === "INCOMPLETE"),
    [boxes]
  );

  const doneBoxes = useMemo(
    () => boxes.filter((b) => b.status === "COMPLETED"),
    [boxes]
  );

  const draftBoxes = useMemo(
    () => boxes.filter((b) => b.status === "DRAFT"),
    [boxes]
  );

  const getBoxesForTab = useMemo(() => {
    return (tab: TabValue): T[] => {
      switch (tab) {
        case "mine":
          return myBoxes;
        case "pending":
          return pendingBoxes;
        case "incomplete":
          return incompleteBoxes;
        case "done":
          return doneBoxes;
        case "draft":
          return draftBoxes;
        case "all":
        default:
          return boxes;
      }
    };
  }, [myBoxes, pendingBoxes, incompleteBoxes, doneBoxes, draftBoxes, boxes]);

  const counts = useMemo(
    () => ({
      myBoxes: myBoxes.length,
      pendingBoxes: pendingBoxes.length,
      incompleteBoxes: incompleteBoxes.length,
      doneBoxes: doneBoxes.length,
      draftBoxes: draftBoxes.length,
      total: boxes.length,
    }),
    [myBoxes, pendingBoxes, incompleteBoxes, doneBoxes, draftBoxes, boxes]
  );

  return {
    myBoxes,
    pendingBoxes,
    incompleteBoxes,
    doneBoxes,
    draftBoxes,
    getBoxesForTab,
    counts,
  };
}

// Keep old name for backward compatibility
export const useDocumentFilters = useBoxFilters;
export default useBoxFilters;
