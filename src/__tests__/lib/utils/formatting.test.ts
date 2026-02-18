import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getInitials,
  formatDate,
  calculateResidenceDuration,
} from "@/lib/utils/formatting";
import { createTranslator } from "@/lib/i18n";

const t = createTranslator("ja");

describe("getInitials", () => {
  it("returns initials from a single name", () => {
    expect(getInitials("Taro")).toBe("T");
  });

  it("returns initials from two names", () => {
    expect(getInitials("Taro Yamada")).toBe("TY");
  });

  it("returns initials from three names (max 2)", () => {
    expect(getInitials("John Michael Smith")).toBe("JM");
  });

  it("handles Japanese names with space", () => {
    expect(getInitials("山田 太郎")).toBe("山太");
  });

  it("handles multiple spaces", () => {
    expect(getInitials("Taro   Yamada")).toBe("TY");
  });

  it("returns '?' for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("returns '?' for null input", () => {
    expect(getInitials(null as unknown as string)).toBe("?");
  });

  it("returns '?' for undefined input", () => {
    expect(getInitials(undefined as unknown as string)).toBe("?");
  });

  it("returns '?' for non-string input", () => {
    expect(getInitials(123 as unknown as string)).toBe("?");
  });

  it("handles leading/trailing spaces", () => {
    expect(getInitials("  Taro Yamada  ")).toBe("TY");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("taro yamada")).toBe("TY");
  });
});

describe("formatDate", () => {
  it("formats valid date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("2024");
    expect(result).toContain("1");
    expect(result).toContain("15");
  });

  it("returns null for null input", () => {
    expect(formatDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(formatDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(formatDate("")).toBeNull();
  });

  it("returns null for invalid date string", () => {
    expect(formatDate("invalid-date")).toBeNull();
  });

  it("accepts custom format options", () => {
    const result = formatDate("2024-01-15", { year: "numeric", month: "long" });
    expect(result).toContain("2024");
    expect(result).toContain("1月");
  });

  it("handles ISO datetime strings", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    expect(result).not.toBeNull();
  });
});

describe("calculateResidenceDuration", () => {
  let mockDate: Date;

  beforeEach(() => {
    // Mock current date to 2024-06-15 for consistent testing
    mockDate = new Date("2024-06-15T00:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '入居したばかり' for less than 1 month", () => {
    expect(calculateResidenceDuration("2024-06-01", t)).toBe("入居したばかり");
  });

  it("returns months for less than 1 year", () => {
    expect(calculateResidenceDuration("2024-01-15", t)).toBe("5ヶ月");
  });

  it("returns years only when months are exactly divisible", () => {
    expect(calculateResidenceDuration("2023-06-15", t)).toBe("1年");
  });

  it("returns years and months for mixed duration", () => {
    expect(calculateResidenceDuration("2023-01-15", t)).toBe("1年5ヶ月");
  });

  it("returns null for null input", () => {
    expect(calculateResidenceDuration(null, t)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(calculateResidenceDuration(undefined, t)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(calculateResidenceDuration("invalid", t)).toBeNull();
  });
});
