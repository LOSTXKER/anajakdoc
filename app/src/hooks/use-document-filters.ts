"use client";

import { useMemo } from "react";
import type { DocumentStatus } from "@/types";

interface FilterableDocument {
  id: string;
  status: DocumentStatus | string;
  submittedById?: string;
}

interface UseDocumentFiltersResult<T extends FilterableDocument> {
  /** Documents submitted by current user */
  myDocs: T[];
  /** Documents pending review (PENDING_REVIEW, NEED_INFO) */
  pendingDocs: T[];
  /** Documents ready to export (READY_TO_EXPORT) */
  readyDocs: T[];
  /** Completed documents (EXPORTED, BOOKED) */
  doneDocs: T[];
  /** Draft documents */
  draftDocs: T[];
  /** Get documents for a specific tab */
  getDocsForTab: (tab: TabValue) => T[];
  /** Document counts */
  counts: {
    myDocs: number;
    pendingDocs: number;
    readyDocs: number;
    doneDocs: number;
    draftDocs: number;
    total: number;
  };
}

export type TabValue = "mine" | "pending" | "ready" | "done" | "draft" | "all";

/**
 * Hook สำหรับ filter documents ตาม status และ user
 * ใช้แทน logic ที่ซ้ำกันใน unified-document-view, document-management
 */
export function useDocumentFilters<T extends FilterableDocument>(
  documents: T[],
  userId?: string
): UseDocumentFiltersResult<T> {
  const myDocs = useMemo(
    () => (userId ? documents.filter((d) => d.submittedById === userId) : []),
    [documents, userId]
  );

  const pendingDocs = useMemo(
    () =>
      documents.filter((d) =>
        ["PENDING_REVIEW", "NEED_INFO"].includes(d.status)
      ),
    [documents]
  );

  const readyDocs = useMemo(
    () => documents.filter((d) => d.status === "READY_TO_EXPORT"),
    [documents]
  );

  const doneDocs = useMemo(
    () => documents.filter((d) => ["EXPORTED", "BOOKED"].includes(d.status)),
    [documents]
  );

  const draftDocs = useMemo(
    () => documents.filter((d) => d.status === "DRAFT"),
    [documents]
  );

  const getDocsForTab = useMemo(() => {
    return (tab: TabValue): T[] => {
      switch (tab) {
        case "mine":
          return myDocs;
        case "pending":
          return pendingDocs;
        case "ready":
          return readyDocs;
        case "done":
          return doneDocs;
        case "draft":
          return draftDocs;
        case "all":
        default:
          return documents;
      }
    };
  }, [myDocs, pendingDocs, readyDocs, doneDocs, draftDocs, documents]);

  const counts = useMemo(
    () => ({
      myDocs: myDocs.length,
      pendingDocs: pendingDocs.length,
      readyDocs: readyDocs.length,
      doneDocs: doneDocs.length,
      draftDocs: draftDocs.length,
      total: documents.length,
    }),
    [myDocs, pendingDocs, readyDocs, doneDocs, draftDocs, documents]
  );

  return {
    myDocs,
    pendingDocs,
    readyDocs,
    doneDocs,
    draftDocs,
    getDocsForTab,
    counts,
  };
}

export default useDocumentFilters;
