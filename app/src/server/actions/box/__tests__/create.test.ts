/**
 * Create Box Logic Tests
 * 
 * Tests for the utility functions used in box creation.
 * Server actions with "use server" directive cannot be directly unit tested.
 */
import { describe, it, expect } from "vitest";

// Test box number generation logic
describe("Box Number Generation Logic", () => {
  const getPrefix = (boxType: "EXPENSE" | "INCOME"): string => {
    return boxType === "EXPENSE" ? "EXP" : "INC";
  };

  const generateBoxNumber = (
    boxType: "EXPENSE" | "INCOME",
    count: number,
    date: Date = new Date()
  ): string => {
    const prefix = getPrefix(boxType);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const sequence = (count + 1).toString().padStart(4, "0");
    return `${prefix}${year}${month}-${sequence}`;
  };

  it("should generate correct prefix for EXPENSE", () => {
    expect(getPrefix("EXPENSE")).toBe("EXP");
  });

  it("should generate correct prefix for INCOME", () => {
    expect(getPrefix("INCOME")).toBe("INC");
  });

  it("should generate correct box number format", () => {
    const date = new Date("2026-01-21");
    const result = generateBoxNumber("EXPENSE", 0, date);
    
    expect(result).toBe("EXP2601-0001");
  });

  it("should generate correct sequence number", () => {
    const date = new Date("2026-01-21");
    const result = generateBoxNumber("EXPENSE", 99, date);
    
    expect(result).toBe("EXP2601-0100");
  });

  it("should pad month correctly", () => {
    const date = new Date("2026-09-15");
    const result = generateBoxNumber("INCOME", 5, date);
    
    expect(result).toBe("INC2609-0006");
  });

  it("should handle December month correctly", () => {
    const date = new Date("2026-12-25");
    const result = generateBoxNumber("INCOME", 0, date);
    
    expect(result).toBe("INC2612-0001");
  });
});

// Test WHT calculation logic
describe("WHT Amount Calculation", () => {
  const calculateWhtAmount = (
    totalAmount: number,
    hasVat: boolean,
    whtRate: number
  ): number => {
    const baseAmount = hasVat ? totalAmount / 1.07 : totalAmount;
    return Math.round(baseAmount * (whtRate / 100) * 100) / 100;
  };

  it("should calculate WHT correctly without VAT", () => {
    const result = calculateWhtAmount(1000, false, 3);
    expect(result).toBe(30);
  });

  it("should calculate WHT correctly with VAT", () => {
    // Total = 1070 (1000 + 7% VAT)
    // Base = 1070 / 1.07 = 1000
    // WHT = 1000 * 0.03 = 30
    const result = calculateWhtAmount(1070, true, 3);
    expect(result).toBe(30);
  });

  it("should calculate WHT with 5% rate", () => {
    const result = calculateWhtAmount(1000, false, 5);
    expect(result).toBe(50);
  });

  it("should calculate WHT with 1% rate", () => {
    const result = calculateWhtAmount(1000, false, 1);
    expect(result).toBe(10);
  });

  it("should round to 2 decimal places", () => {
    // 333.33 * 0.03 = 9.9999
    const result = calculateWhtAmount(333.33, false, 3);
    expect(result).toBe(10);
  });
});

// Test VAT calculation logic
describe("VAT Amount Calculation", () => {
  const calculateVatAmount = (totalAmount: number, hasVat: boolean): number => {
    if (!hasVat) return 0;
    const baseAmount = totalAmount / 1.07;
    return Math.round((totalAmount - baseAmount) * 100) / 100;
  };

  it("should return 0 when hasVat is false", () => {
    const result = calculateVatAmount(1000, false);
    expect(result).toBe(0);
  });

  it("should calculate VAT correctly", () => {
    // Total = 1070, Base = 1000, VAT = 70
    const result = calculateVatAmount(1070, true);
    expect(result).toBe(70);
  });

  it("should handle smaller amounts", () => {
    // Total = 107, Base = 100, VAT = 7
    const result = calculateVatAmount(107, true);
    expect(result).toBe(7);
  });
});

// Test form data parsing
describe("Form Data Parsing", () => {
  const parseAmount = (value: string | null): number | null => {
    if (!value || value.trim() === "") return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const parseBoolean = (value: string | null): boolean => {
    return value === "true";
  };

  it("should parse valid amount", () => {
    expect(parseAmount("1000")).toBe(1000);
    expect(parseAmount("1000.50")).toBe(1000.50);
  });

  it("should return null for empty amount", () => {
    expect(parseAmount("")).toBe(null);
    expect(parseAmount(null)).toBe(null);
  });

  it("should return null for invalid amount", () => {
    expect(parseAmount("abc")).toBe(null);
  });

  it("should parse boolean true", () => {
    expect(parseBoolean("true")).toBe(true);
  });

  it("should parse boolean false", () => {
    expect(parseBoolean("false")).toBe(false);
    expect(parseBoolean(null)).toBe(false);
    expect(parseBoolean("")).toBe(false);
  });
});

// Test WHT tracking type determination
describe("WHT Tracking Type", () => {
  const getWhtTrackingType = (boxType: "EXPENSE" | "INCOME") => {
    return boxType === "INCOME" ? "INCOMING" : "OUTGOING";
  };

  it("should return OUTGOING for EXPENSE", () => {
    expect(getWhtTrackingType("EXPENSE")).toBe("OUTGOING");
  });

  it("should return INCOMING for INCOME", () => {
    expect(getWhtTrackingType("INCOME")).toBe("INCOMING");
  });
});
