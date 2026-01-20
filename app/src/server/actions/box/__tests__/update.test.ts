/**
 * Update Box Logic Tests
 * 
 * Tests for the utility functions used in box updates.
 */
import { describe, it, expect } from "vitest";

// Test form data to update data conversion
describe("Form Data to Update Data Conversion", () => {
  type UpdateData = Record<string, unknown>;

  const parseFormToUpdateData = (formData: FormData): UpdateData => {
    const data: UpdateData = {};
    
    // String fields
    const title = formData.get("title");
    if (title) data.title = title.toString();
    
    const description = formData.get("description");
    if (description !== null) {
      data.description = description.toString() || null;
    }
    
    // Number fields
    const totalAmount = formData.get("totalAmount");
    if (totalAmount) {
      const num = parseFloat(totalAmount.toString());
      if (!isNaN(num)) data.totalAmount = num;
    }
    
    const whtRate = formData.get("whtRate");
    if (whtRate) {
      const num = parseFloat(whtRate.toString());
      if (!isNaN(num)) data.whtRate = num;
    }
    
    const whtAmount = formData.get("whtAmount");
    if (whtAmount) {
      const num = parseFloat(whtAmount.toString());
      if (!isNaN(num)) data.whtAmount = num;
    }
    
    // Boolean fields
    const hasVat = formData.get("hasVat");
    if (hasVat !== null) {
      data.hasVat = hasVat === "true";
    }
    
    const hasWht = formData.get("hasWht");
    if (hasWht !== null) {
      data.hasWht = hasWht === "true";
    }
    
    // Date fields
    const boxDate = formData.get("boxDate");
    if (boxDate) {
      data.boxDate = new Date(boxDate.toString());
    }
    
    // Nullable ID fields
    const categoryId = formData.get("categoryId");
    if (categoryId !== null) {
      data.categoryId = categoryId.toString() || null;
    }
    
    const contactId = formData.get("contactId");
    if (contactId !== null) {
      data.contactId = contactId.toString() || null;
    }
    
    return data;
  };

  it("should parse title correctly", () => {
    const formData = new FormData();
    formData.append("title", "Test Title");
    
    const result = parseFormToUpdateData(formData);
    expect(result.title).toBe("Test Title");
  });

  it("should parse totalAmount as number", () => {
    const formData = new FormData();
    formData.append("totalAmount", "1500.50");
    
    const result = parseFormToUpdateData(formData);
    expect(result.totalAmount).toBe(1500.50);
  });

  it("should parse hasVat as boolean", () => {
    const formData = new FormData();
    formData.append("hasVat", "true");
    
    const result = parseFormToUpdateData(formData);
    expect(result.hasVat).toBe(true);
  });

  it("should parse hasVat false correctly", () => {
    const formData = new FormData();
    formData.append("hasVat", "false");
    
    const result = parseFormToUpdateData(formData);
    expect(result.hasVat).toBe(false);
  });

  it("should parse boxDate as Date", () => {
    const formData = new FormData();
    formData.append("boxDate", "2026-06-15");
    
    const result = parseFormToUpdateData(formData);
    expect(result.boxDate).toBeInstanceOf(Date);
    expect((result.boxDate as Date).toISOString().slice(0, 10)).toBe("2026-06-15");
  });

  it("should set null for empty categoryId", () => {
    const formData = new FormData();
    formData.append("categoryId", "");
    
    const result = parseFormToUpdateData(formData);
    expect(result.categoryId).toBeNull();
  });

  it("should set null for empty contactId", () => {
    const formData = new FormData();
    formData.append("contactId", "");
    
    const result = parseFormToUpdateData(formData);
    expect(result.contactId).toBeNull();
  });

  it("should parse multiple fields", () => {
    const formData = new FormData();
    formData.append("title", "Updated Title");
    formData.append("totalAmount", "2500");
    formData.append("hasVat", "true");
    formData.append("hasWht", "true");
    formData.append("whtRate", "3");
    
    const result = parseFormToUpdateData(formData);
    
    expect(result.title).toBe("Updated Title");
    expect(result.totalAmount).toBe(2500);
    expect(result.hasVat).toBe(true);
    expect(result.hasWht).toBe(true);
    expect(result.whtRate).toBe(3);
  });

  it("should handle null description", () => {
    const formData = new FormData();
    formData.append("description", "");
    
    const result = parseFormToUpdateData(formData);
    expect(result.description).toBeNull();
  });
});

// Test changed fields tracking
describe("Changed Fields Tracking", () => {
  const getChangedFields = (formData: FormData): string[] => {
    const fields: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (value !== "" && value !== null) {
        fields.push(key);
      }
    }
    
    return fields;
  };

  it("should return list of changed fields", () => {
    const formData = new FormData();
    formData.append("title", "New Title");
    formData.append("totalAmount", "1000");
    
    const result = getChangedFields(formData);
    
    expect(result).toContain("title");
    expect(result).toContain("totalAmount");
    expect(result.length).toBe(2);
  });

  it("should exclude empty fields", () => {
    const formData = new FormData();
    formData.append("title", "New Title");
    formData.append("description", "");
    
    const result = getChangedFields(formData);
    
    expect(result).toContain("title");
    expect(result).not.toContain("description");
  });
});

// Test foreign currency handling
describe("Foreign Currency Handling", () => {
  type ForeignCurrencyData = {
    foreignCurrency: string | null;
    foreignAmount: number | null;
    exchangeRate: number | null;
  };

  const parseForeignCurrency = (formData: FormData): ForeignCurrencyData => {
    const currency = formData.get("foreignCurrency");
    const amount = formData.get("foreignAmount");
    const rate = formData.get("exchangeRate");
    
    return {
      foreignCurrency: currency?.toString() || null,
      foreignAmount: amount ? parseFloat(amount.toString()) : null,
      exchangeRate: rate ? parseFloat(rate.toString()) : null,
    };
  };

  it("should parse foreign currency data", () => {
    const formData = new FormData();
    formData.append("foreignCurrency", "USD");
    formData.append("foreignAmount", "100");
    formData.append("exchangeRate", "35.50");
    
    const result = parseForeignCurrency(formData);
    
    expect(result.foreignCurrency).toBe("USD");
    expect(result.foreignAmount).toBe(100);
    expect(result.exchangeRate).toBe(35.50);
  });

  it("should return null for empty foreign currency", () => {
    const formData = new FormData();
    
    const result = parseForeignCurrency(formData);
    
    expect(result.foreignCurrency).toBeNull();
    expect(result.foreignAmount).toBeNull();
    expect(result.exchangeRate).toBeNull();
  });

  it("should calculate THB amount from foreign", () => {
    const calculateThbAmount = (foreignAmount: number, exchangeRate: number) => {
      return Math.round(foreignAmount * exchangeRate * 100) / 100;
    };
    
    expect(calculateThbAmount(100, 35.50)).toBe(3550);
    expect(calculateThbAmount(50.25, 35)).toBe(1758.75);
  });
});

// Test payment status updates
describe("Payment Status Updates", () => {
  type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

  const calculatePaymentStatus = (
    paidAmount: number,
    totalAmount: number
  ): PaymentStatus => {
    if (paidAmount >= totalAmount) return "PAID";
    if (paidAmount > 0) return "PARTIAL";
    return "UNPAID";
  };

  it("should return UNPAID when paidAmount is 0", () => {
    expect(calculatePaymentStatus(0, 1000)).toBe("UNPAID");
  });

  it("should return PARTIAL when paidAmount is less than totalAmount", () => {
    expect(calculatePaymentStatus(500, 1000)).toBe("PARTIAL");
  });

  it("should return PAID when paidAmount equals totalAmount", () => {
    expect(calculatePaymentStatus(1000, 1000)).toBe("PAID");
  });

  it("should return PAID when paidAmount exceeds totalAmount", () => {
    expect(calculatePaymentStatus(1100, 1000)).toBe("PAID");
  });
});

// Test validation
describe("Update Validation", () => {
  const validateUpdate = (data: Record<string, unknown>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.totalAmount !== undefined && typeof data.totalAmount === "number") {
      if (data.totalAmount < 0) {
        errors.push("totalAmount cannot be negative");
      }
    }
    
    if (data.whtRate !== undefined && typeof data.whtRate === "number") {
      if (data.whtRate < 0 || data.whtRate > 100) {
        errors.push("whtRate must be between 0 and 100");
      }
    }
    
    if (data.title !== undefined && typeof data.title === "string") {
      if (data.title.length > 255) {
        errors.push("title cannot exceed 255 characters");
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  };

  it("should validate valid data", () => {
    const result = validateUpdate({ totalAmount: 1000, whtRate: 3 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject negative totalAmount", () => {
    const result = validateUpdate({ totalAmount: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("totalAmount cannot be negative");
  });

  it("should reject whtRate over 100", () => {
    const result = validateUpdate({ whtRate: 150 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("whtRate must be between 0 and 100");
  });

  it("should reject title over 255 characters", () => {
    const longTitle = "a".repeat(256);
    const result = validateUpdate({ title: longTitle });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("title cannot exceed 255 characters");
  });
});
