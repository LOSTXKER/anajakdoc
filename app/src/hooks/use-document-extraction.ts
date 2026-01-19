"use client";

import { useState, useCallback, useRef } from "react";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ai-classify";
import type { ExtractedFile, ExtractionStatus } from "@/components/documents/document-file-card";

interface UseDocumentExtractionOptions {
  /** Auto-analyze files on upload */
  autoAnalyze?: boolean;
  /** Callback when a file is analyzed */
  onFileAnalyzed?: (file: ExtractedFile) => void;
  /** Callback when all files are analyzed */
  onAllAnalyzed?: (files: ExtractedFile[]) => void;
}

interface UseDocumentExtractionReturn {
  /** List of extracted files with their status */
  files: ExtractedFile[];
  /** Add new files to the list */
  addFiles: (newFiles: File[]) => Promise<void>;
  /** Remove a file by id */
  removeFile: (id: string) => void;
  /** Re-analyze a specific file */
  reanalyzeFile: (id: string) => Promise<void>;
  /** Analyze all pending files */
  analyzeAll: () => Promise<void>;
  /** Check if any file is currently being analyzed */
  isAnalyzing: boolean;
  /** Check if all files have been analyzed */
  allAnalyzed: boolean;
  /** Get files that are done */
  analyzedFiles: ExtractedFile[];
  /** Clear all files */
  clearFiles: () => void;
  /** Update extracted data for a file (manual edit) */
  updateFileData: (id: string, data: Partial<ExtractedDocumentData>) => void;
}

let fileIdCounter = 0;
function generateFileId(): string {
  return `file-${++fileIdCounter}-${Date.now()}`;
}

/**
 * Hook for managing document extraction state
 * Handles auto-analysis, re-analysis, and file management
 */
export function useDocumentExtraction(
  options: UseDocumentExtractionOptions = {}
): UseDocumentExtractionReturn {
  const { autoAnalyze = true, onFileAnalyzed, onAllAnalyzed } = options;
  
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const analyzingRef = useRef<Set<string>>(new Set());

  // Helper to convert File to base64
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Analyze a single file
  const analyzeFile = useCallback(async (extractedFile: ExtractedFile): Promise<ExtractedFile> => {
    const { id, file } = extractedFile;
    
    // Skip if already analyzing
    if (analyzingRef.current.has(id)) {
      return extractedFile;
    }
    
    analyzingRef.current.add(id);
    
    // Update status to analyzing
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: "analyzing" as ExtractionStatus } : f
    ));

    try {
      const base64Data = await fileToBase64(file);
      const result = await extractDocumentData(base64Data, file.type);
      
      const updatedFile: ExtractedFile = {
        ...extractedFile,
        status: result.success ? "done" : "error",
        extractedData: result.data,
        error: result.error,
      };
      
      setFiles(prev => prev.map(f => f.id === id ? updatedFile : f));
      onFileAnalyzed?.(updatedFile);
      
      return updatedFile;
    } catch (err) {
      const errorFile: ExtractedFile = {
        ...extractedFile,
        status: "error",
        error: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการวิเคราะห์",
      };
      
      setFiles(prev => prev.map(f => f.id === id ? errorFile : f));
      
      return errorFile;
    } finally {
      analyzingRef.current.delete(id);
    }
  }, [fileToBase64, onFileAnalyzed]);

  // Add new files
  const addFiles = useCallback(async (newFiles: File[]) => {
    const extractedFiles: ExtractedFile[] = newFiles.map(file => ({
      id: generateFileId(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as ExtractionStatus,
    }));

    setFiles(prev => [...prev, ...extractedFiles]);

    // Auto-analyze if enabled
    if (autoAnalyze) {
      // Analyze files in parallel
      const results = await Promise.all(
        extractedFiles.map(f => analyzeFile(f))
      );
      
      // Get the latest state after all analyses
      setFiles(current => {
        const allDone = current.every(f => f.status === "done" || f.status === "error");
        if (allDone) {
          onAllAnalyzed?.(current);
        }
        return current;
      });
    }
  }, [autoAnalyze, analyzeFile, onAllAnalyzed]);

  // Remove a file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Re-analyze a file
  const reanalyzeFile = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      await analyzeFile(file);
    }
  }, [files, analyzeFile]);

  // Analyze all pending files
  const analyzeAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "error");
    await Promise.all(pendingFiles.map(f => analyzeFile(f)));
  }, [files, analyzeFile]);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  // Update file data manually
  const updateFileData = useCallback((id: string, data: Partial<ExtractedDocumentData>) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id && f.extractedData) {
        return {
          ...f,
          extractedData: { ...f.extractedData, ...data },
        };
      }
      return f;
    }));
  }, []);

  // Computed values
  const isAnalyzing = files.some(f => f.status === "analyzing");
  const allAnalyzed = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");
  const analyzedFiles = files.filter(f => f.status === "done");

  return {
    files,
    addFiles,
    removeFile,
    reanalyzeFile,
    analyzeAll,
    isAnalyzing,
    allAnalyzed,
    analyzedFiles,
    clearFiles,
    updateFileData,
  };
}

export default useDocumentExtraction;
