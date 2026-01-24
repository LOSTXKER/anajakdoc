import { describe, it, expect } from "vitest";
import { 
  WHT_RATES, 
  WHT_RATE_OPTIONS, 
  WHT_RATE_SIMPLE,
  type WhtRateValue 
} from "../wht";

describe("WHT Constants", () => {
  describe("WHT_RATES", () => {
    it("should have exactly 4 rate options", () => {
      expect(WHT_RATES).toHaveLength(4);
    });

    it("should contain all standard WHT rates", () => {
      const values = WHT_RATES.map(r => r.value);
      expect(values).toContain("1");
      expect(values).toContain("2");
      expect(values).toContain("3");
      expect(values).toContain("5");
    });

    it("should have correct structure for each rate", () => {
      WHT_RATES.forEach(rate => {
        expect(rate).toHaveProperty("value");
        expect(rate).toHaveProperty("label");
        expect(rate).toHaveProperty("description");
        expect(typeof rate.value).toBe("string");
        expect(rate.label).toMatch(/^\d+%$/);
      });
    });

    it("should have 1% rate for advertising", () => {
      const rate1 = WHT_RATES.find(r => r.value === "1");
      expect(rate1).toBeDefined();
      expect(rate1?.label).toBe("1%");
      expect(rate1?.description).toBe("ค่าโฆษณา");
    });

    it("should have 2% rate for transportation", () => {
      const rate2 = WHT_RATES.find(r => r.value === "2");
      expect(rate2).toBeDefined();
      expect(rate2?.label).toBe("2%");
      expect(rate2?.description).toBe("ค่าขนส่ง");
    });

    it("should have 3% rate for services", () => {
      const rate3 = WHT_RATES.find(r => r.value === "3");
      expect(rate3).toBeDefined();
      expect(rate3?.label).toBe("3%");
      expect(rate3?.description).toBe("ค่าบริการ/จ้างทำของ");
    });

    it("should have 5% rate for rental", () => {
      const rate5 = WHT_RATES.find(r => r.value === "5");
      expect(rate5).toBeDefined();
      expect(rate5?.label).toBe("5%");
      expect(rate5?.description).toBe("ค่าเช่า");
    });
  });

  describe("WHT_RATE_OPTIONS", () => {
    it("should have same length as WHT_RATES", () => {
      expect(WHT_RATE_OPTIONS).toHaveLength(WHT_RATES.length);
    });

    it("should have combined label with description", () => {
      WHT_RATE_OPTIONS.forEach((option, index) => {
        const original = WHT_RATES[index];
        expect(option.value).toBe(original.value);
        expect(option.label).toBe(`${original.label} - ${original.description}`);
      });
    });

    it("should be suitable for dropdown menus", () => {
      WHT_RATE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });
  });

  describe("WHT_RATE_SIMPLE", () => {
    it("should have same length as WHT_RATES", () => {
      expect(WHT_RATE_SIMPLE).toHaveLength(WHT_RATES.length);
    });

    it("should have only percentage as label", () => {
      WHT_RATE_SIMPLE.forEach((option, index) => {
        const original = WHT_RATES[index];
        expect(option.value).toBe(original.value);
        expect(option.label).toBe(original.label);
        expect(option.label).toMatch(/^\d+%$/);
      });
    });
  });

  describe("WhtRateValue type", () => {
    it("should accept valid rate values", () => {
      const validValues: WhtRateValue[] = ["1", "2", "3", "5"];
      expect(validValues).toHaveLength(4);
    });
  });
});
