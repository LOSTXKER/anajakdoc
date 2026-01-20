/**
 * Checklist Logic Tests
 */
import { describe, it, expect } from "vitest";
import { 
  getAutoChecklistUpdates, 
  determineDocStatus, 
  calculateCompletionPercent,
  isAllRequiredComplete,
  type BoxChecklist,
  type ChecklistItem 
} from "@/lib/checklist";
import type { DocType } from "@/types";

describe("Checklist Logic", () => {
  describe("getAutoChecklistUpdates", () => {
    it("should return hasTaxInvoice: true when TAX_INVOICE is present", () => {
      const docTypes = new Set<DocType>(["TAX_INVOICE", "SLIP_TRANSFER"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasTaxInvoice).toBe(true);
    });

    it("should return hasTaxInvoice: true when TAX_INVOICE_ABB is present", () => {
      const docTypes = new Set<DocType>(["TAX_INVOICE_ABB"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasTaxInvoice).toBe(true);
    });

    it("should not set hasTaxInvoice when no VAT document present", () => {
      const docTypes = new Set<DocType>(["SLIP_TRANSFER", "RECEIPT"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasTaxInvoice).toBeUndefined();
    });

    it("should return hasPaymentProof: true when SLIP_TRANSFER is present", () => {
      const docTypes = new Set<DocType>(["SLIP_TRANSFER"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasPaymentProof).toBe(true);
    });

    it("should return hasPaymentProof: true when BANK_STATEMENT is present", () => {
      const docTypes = new Set<DocType>(["BANK_STATEMENT"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasPaymentProof).toBe(true);
    });

    it("should return hasPaymentProof: true when RECEIPT is present", () => {
      const docTypes = new Set<DocType>(["RECEIPT"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasPaymentProof).toBe(true);
    });

    it("should return whtIssued: true when WHT_SENT is present", () => {
      const docTypes = new Set<DocType>(["WHT_SENT"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.whtIssued).toBe(true);
    });

    it("should return whtReceived: true when WHT_INCOMING is present", () => {
      const docTypes = new Set<DocType>(["WHT_INCOMING"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.whtReceived).toBe(true);
    });

    it("should return hasInvoice: true when INVOICE is present", () => {
      const docTypes = new Set<DocType>(["INVOICE"]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasInvoice).toBe(true);
    });

    it("should handle multiple document types correctly", () => {
      const docTypes = new Set<DocType>([
        "TAX_INVOICE", 
        "SLIP_TRANSFER", 
        "WHT_SENT", 
        "RECEIPT"
      ]);
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasTaxInvoice).toBe(true);
      expect(result.hasPaymentProof).toBe(true);
      expect(result.whtIssued).toBe(true);
    });

    it("should handle empty document set", () => {
      const docTypes = new Set<DocType>();
      const result = getAutoChecklistUpdates(docTypes);
      
      expect(result.hasTaxInvoice).toBeUndefined();
      expect(result.hasPaymentProof).toBeUndefined();
      expect(result.whtIssued).toBeUndefined();
    });
  });

  describe("determineDocStatus", () => {
    const createChecklist = (overrides: Partial<BoxChecklist> = {}): BoxChecklist => ({
      isPaid: false,
      hasPaymentProof: false,
      hasTaxInvoice: false,
      hasInvoice: false,
      whtIssued: false,
      whtSent: false,
      whtReceived: false,
      ...overrides,
    });

    describe("STANDARD expense (has VAT)", () => {
      it("should return COMPLETE when all requirements met", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasTaxInvoice: true,
          hasPaymentProof: true,
        });
        const docTypes = new Set<DocType>(["TAX_INVOICE", "SLIP_TRANSFER"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "STANDARD",
          true,  // hasVat
          false, // hasWht
          checklist,
          docTypes
        );
        
        expect(status).toBe("COMPLETE");
      });

      it("should return INCOMPLETE when isPaid is false", () => {
        const checklist = createChecklist({
          isPaid: false,
          hasTaxInvoice: true,
        });
        const docTypes = new Set<DocType>(["TAX_INVOICE"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "STANDARD",
          true,
          false,
          checklist,
          docTypes
        );
        
        expect(status).toBe("INCOMPLETE");
      });

      it("should return INCOMPLETE when no TAX_INVOICE", () => {
        const checklist = createChecklist({
          isPaid: true,
        });
        const docTypes = new Set<DocType>(["SLIP_TRANSFER"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "STANDARD",
          true,
          false,
          checklist,
          docTypes
        );
        
        expect(status).toBe("INCOMPLETE");
      });
    });

    describe("STANDARD expense with WHT", () => {
      it("should require whtSent for COMPLETE", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasTaxInvoice: true,
          whtIssued: true,
          whtSent: false,
        });
        const docTypes = new Set<DocType>(["TAX_INVOICE", "WHT_SENT", "SLIP_TRANSFER"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "STANDARD",
          true,
          true, // hasWht
          checklist,
          docTypes
        );
        
        expect(status).toBe("INCOMPLETE");
      });

      it("should be COMPLETE when whtSent is true", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasTaxInvoice: true,
          whtIssued: true,
          whtSent: true,
        });
        const docTypes = new Set<DocType>(["TAX_INVOICE", "WHT_SENT", "SLIP_TRANSFER"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "STANDARD",
          true,
          true,
          checklist,
          docTypes
        );
        
        expect(status).toBe("COMPLETE");
      });
    });

    describe("INCOME box", () => {
      it("should return COMPLETE when requirements met", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasInvoice: true,
        });
        const docTypes = new Set<DocType>(["INVOICE"]);
        
        const status = determineDocStatus(
          "INCOME",
          null, // no expenseType for INCOME
          false,
          false,
          checklist,
          docTypes
        );
        
        expect(status).toBe("COMPLETE");
      });

      it("should return INCOMPLETE when isPaid is false", () => {
        const checklist = createChecklist({
          isPaid: false,
          hasInvoice: true,
        });
        const docTypes = new Set<DocType>(["INVOICE"]);
        
        const status = determineDocStatus(
          "INCOME",
          null,
          false,
          false,
          checklist,
          docTypes
        );
        
        expect(status).toBe("INCOMPLETE");
      });
    });

    describe("INCOME with WHT", () => {
      it("should require whtReceived for COMPLETE", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasInvoice: true,
          whtReceived: false,
        });
        const docTypes = new Set<DocType>(["INVOICE"]);
        
        const status = determineDocStatus(
          "INCOME",
          null,
          false,
          true, // hasWht
          checklist,
          docTypes
        );
        
        expect(status).toBe("INCOMPLETE");
      });

      it("should be COMPLETE when whtReceived is true", () => {
        const checklist = createChecklist({
          isPaid: true,
          hasInvoice: true,
          whtReceived: true,
        });
        const docTypes = new Set<DocType>(["INVOICE", "WHT_INCOMING"]);
        
        const status = determineDocStatus(
          "INCOME",
          null,
          false,
          true,
          checklist,
          docTypes
        );
        
        expect(status).toBe("COMPLETE");
      });
    });

    describe("noReceiptReason", () => {
      it("should return NA for special noReceiptReason values", () => {
        const checklist = createChecklist();
        const docTypes = new Set<DocType>();
        
        const status = determineDocStatus(
          "EXPENSE",
          "NO_VAT",
          false,
          false,
          checklist,
          docTypes,
          "NOT_APPLICABLE" // special reason
        );
        
        expect(status).toBe("NA");
      });

      it("should NOT return NA for NO_CASH_RECEIPT", () => {
        const checklist = createChecklist({ isPaid: true });
        const docTypes = new Set<DocType>(["SLIP_TRANSFER"]);
        
        const status = determineDocStatus(
          "EXPENSE",
          "NO_VAT",
          false,
          false,
          checklist,
          docTypes,
          "NO_CASH_RECEIPT"
        );
        
        // Should evaluate normally, not NA
        expect(status).not.toBe("NA");
      });
    });
  });

  describe("calculateCompletionPercent", () => {
    it("should return 100 when all required items complete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: true, completed: true, canToggle: false },
      ];
      
      expect(calculateCompletionPercent(items)).toBe(100);
    });

    it("should return 50 when half of required items complete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: true, completed: false, canToggle: false },
      ];
      
      expect(calculateCompletionPercent(items)).toBe(50);
    });

    it("should return 0 when no required items complete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: false, canToggle: false },
        { id: "2", label: "B", description: "", required: true, completed: false, canToggle: false },
      ];
      
      expect(calculateCompletionPercent(items)).toBe(0);
    });

    it("should ignore non-required items", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: false, completed: false, canToggle: false },
      ];
      
      expect(calculateCompletionPercent(items)).toBe(100);
    });

    it("should return 100 when no required items exist", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: false, completed: false, canToggle: false },
      ];
      
      expect(calculateCompletionPercent(items)).toBe(100);
    });
  });

  describe("isAllRequiredComplete", () => {
    it("should return true when all required items complete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: true, completed: true, canToggle: false },
      ];
      
      expect(isAllRequiredComplete(items)).toBe(true);
    });

    it("should return false when any required item incomplete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: true, completed: false, canToggle: false },
      ];
      
      expect(isAllRequiredComplete(items)).toBe(false);
    });

    it("should return true when only non-required items are incomplete", () => {
      const items: ChecklistItem[] = [
        { id: "1", label: "A", description: "", required: true, completed: true, canToggle: false },
        { id: "2", label: "B", description: "", required: false, completed: false, canToggle: false },
      ];
      
      expect(isAllRequiredComplete(items)).toBe(true);
    });
  });
});
