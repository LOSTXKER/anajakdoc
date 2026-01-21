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
  /** Boxes pending review (SUBMITTED, IN_REVIEW, NEED_MORE_DOCS) */
  pendingBoxes: T[];
  /** Boxes with incomplete documents */
  incompleteBoxes: T[];
  /** Boxes ready (READY_TO_BOOK, WHT_PENDING) */
  readyBoxes: T[];
  /** Completed boxes (BOOKED, ARCHIVED) */
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
    readyBoxes: number;
    doneBoxes: number;
    draftBoxes: number;
    total: number;
  };
}

export type TabValue = "mine" | "pending" | "incomplete" | "ready" | "done" | "draft" | "all";

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

  const pendingBoxes = useMemo(
    () =>
      boxes.filter((b) =>
        ["SUBMITTED", "IN_REVIEW", "NEED_MORE_DOCS"].includes(b.status)
      ),
    [boxes]
  );

  const incompleteBoxes = useMemo(
    () => boxes.filter((b) => b.docStatus === "INCOMPLETE"),
    [boxes]
  );

  const readyBoxes = useMemo(
    () => boxes.filter((b) => ["READY_TO_BOOK", "WHT_PENDING"].includes(b.status)),
    [boxes]
  );

  const doneBoxes = useMemo(
    () => boxes.filter((b) => ["BOOKED", "ARCHIVED", "LOCKED"].includes(b.status)),
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
        case "ready":
          return readyBoxes;
        case "done":
          return doneBoxes;
        case "draft":
          return draftBoxes;
        case "all":
        default:
          return boxes;
      }
    };
  }, [myBoxes, pendingBoxes, incompleteBoxes, readyBoxes, doneBoxes, draftBoxes, boxes]);

  const counts = useMemo(
    () => ({
      myBoxes: myBoxes.length,
      pendingBoxes: pendingBoxes.length,
      incompleteBoxes: incompleteBoxes.length,
      readyBoxes: readyBoxes.length,
      doneBoxes: doneBoxes.length,
      draftBoxes: draftBoxes.length,
      total: boxes.length,
    }),
    [myBoxes, pendingBoxes, incompleteBoxes, readyBoxes, doneBoxes, draftBoxes, boxes]
  );

  return {
    myBoxes,
    pendingBoxes,
    incompleteBoxes,
    readyBoxes,
    doneBoxes,
    draftBoxes,
    getBoxesForTab,
    counts,
  };
}

// Keep old name for backward compatibility
export const useDocumentFilters = useBoxFilters;
export default useBoxFilters;
