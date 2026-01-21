import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBoxUpload } from "../use-box-upload";

// Mock server actions
vi.mock("@/server/actions/box", () => ({
  createBox: vi.fn().mockResolvedValue({ success: true, data: { id: "box-123" } }),
}));

describe("useBoxUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      expect(result.current.boxType).toBe("EXPENSE");
      expect(result.current.expenseType).toBe("STANDARD");
      expect(result.current.isMultiPayment).toBe(false);
      expect(result.current.hasWht).toBe(false);
      expect(result.current.whtRate).toBe("3");
      expect(result.current.files).toEqual([]);
      expect(result.current.amount).toBe("");
      expect(result.current.title).toBe("");
    });

    it("should use INCOME type when specified", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "INCOME", 
        })
      );

      expect(result.current.boxType).toBe("INCOME");
    });
  });

  describe("Box Type", () => {
    it("should update boxType when setBoxType is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setBoxType("INCOME");
      });

      expect(result.current.boxType).toBe("INCOME");
    });
  });

  describe("Expense Type", () => {
    it("should update expenseType when setExpenseType is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setExpenseType("NO_VAT");
      });

      expect(result.current.expenseType).toBe("NO_VAT");
    });
  });

  describe("Multi-Payment State", () => {
    it("should update isMultiPayment when setIsMultiPayment is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      expect(result.current.isMultiPayment).toBe(false);

      act(() => {
        result.current.setIsMultiPayment(true);
      });

      expect(result.current.isMultiPayment).toBe(true);
    });
  });

  describe("WHT State", () => {
    it("should update hasWht when setHasWht is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      expect(result.current.hasWht).toBe(false);

      act(() => {
        result.current.setHasWht(true);
      });

      expect(result.current.hasWht).toBe(true);
    });

    it("should update whtRate when setWhtRate is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      expect(result.current.whtRate).toBe("3"); // Default

      act(() => {
        result.current.setWhtRate("5");
      });

      expect(result.current.whtRate).toBe("5");
    });
  });

  describe("Form Fields", () => {
    it("should update amount when setAmount is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setAmount("1500.50");
      });

      expect(result.current.amount).toBe("1500.50");
    });

    it("should update title when setTitle is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setTitle("Test Box Title");
      });

      expect(result.current.title).toBe("Test Box Title");
    });

    it("should update description when setDescription is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setDescription("Test description");
      });

      expect(result.current.description).toBe("Test description");
    });

    it("should update notes when setNotes is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      act(() => {
        result.current.setNotes("Some notes");
      });

      expect(result.current.notes).toBe("Some notes");
    });
  });

  describe("File Operations", () => {
    it("should start with no files", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe("Reset Form", () => {
    it("should reset all form values when resetForm is called", () => {
      const { result } = renderHook(() => 
        useBoxUpload({ 
          initialType: "EXPENSE", 
        })
      );

      // Change some values
      act(() => {
        result.current.setTitle("Test Title");
        result.current.setAmount("1000");
        result.current.setIsMultiPayment(true);
        result.current.setHasWht(true);
        result.current.setWhtRate("5");
      });

      // Verify changes
      expect(result.current.title).toBe("Test Title");
      expect(result.current.amount).toBe("1000");
      expect(result.current.isMultiPayment).toBe(true);
      expect(result.current.hasWht).toBe(true);

      // Reset
      act(() => {
        result.current.resetForm();
      });

      // Verify reset
      expect(result.current.title).toBe("");
      expect(result.current.amount).toBe("");
      expect(result.current.isMultiPayment).toBe(false);
      expect(result.current.hasWht).toBe(false);
      expect(result.current.whtRate).toBe("3");
      expect(result.current.files).toEqual([]);
    });
  });
});
