import { describe, expect, it } from "vitest";
import {
  cleanAmount,
  compactINR,
  formatINR,
  formatINRFixed,
  formatYears,
  groupIndian,
} from "./format";

describe("groupIndian", () => {
  it("groups in the Indian lakh/crore style", () => {
    expect(groupIndian("1234")).toBe("1,234");
    expect(groupIndian("12345")).toBe("12,345");
    expect(groupIndian("1234567")).toBe("12,34,567");
    expect(groupIndian("123456789")).toBe("12,34,56,789");
    expect(groupIndian("123")).toBe("123");
  });
});

describe("formatINR", () => {
  it("formats positive amounts with Indian grouping", () => {
    expect(formatINR("310677.79", 2)).toBe("₹3,10,677.79");
    expect(formatINR("6607.54", 2)).toBe("₹6,607.54");
    expect(formatINR("100000", 0)).toBe("₹1,00,000");
  });

  it("trims trailing zeros from decimals", () => {
    expect(formatINR("100.00", 2)).toBe("₹100");
    expect(formatINR("100.50", 2)).toBe("₹100.5");
  });

  it("handles negatives", () => {
    expect(formatINR("-1234.5", 2)).toBe("-₹1,234.5");
    expect(formatINR("0", 2)).toBe("₹0");
    expect(formatINR("", 2)).toBe("₹0");
  });

  it("strips the rupee symbol and separators from input", () => {
    expect(formatINR("₹1,234.50")).toBe("₹1,234.5");
  });
});

describe("formatINRFixed", () => {
  it("pads to two decimals", () => {
    expect(formatINRFixed("100")).toBe("₹100.00");
    expect(formatINRFixed("100.5")).toBe("₹100.50");
  });
});

describe("compactINR", () => {
  it("compacts lakh and crore values", () => {
    expect(compactINR("100000")).toBe("₹1L");
    expect(compactINR("10000000")).toBe("₹1 Cr");
    expect(compactINR("150000")).toBe("₹1.5L");
  });
});

describe("cleanAmount and formatYears", () => {
  it("cleans currency formatting", () => {
    expect(cleanAmount("₹1,234.50")).toBe("1234.50");
    expect(cleanAmount("8,000")).toBe("8000");
  });

  it("formats month counts as years", () => {
    expect(formatYears(65)).toBe("(5.4 yrs)");
    expect(formatYears(120)).toBe("(10 yrs)");
  });
});