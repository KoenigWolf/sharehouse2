import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getInitials,
  formatDate,
  formatDateShort,
  calculateResidenceDuration,
  truncateText,
  parseInterests,
  formatInterests,
} from "@/lib/utils/formatting";

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

describe("formatDateShort", () => {
  it("formats date in short format", () => {
    const result = formatDateShort("2024-01-15");
    expect(result).toContain("1");
    expect(result).toContain("15");
    expect(result).not.toContain("2024");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDateShort("invalid")).toBe("");
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
    expect(calculateResidenceDuration("2024-06-01")).toBe("入居したばかり");
  });

  it("returns months for less than 1 year", () => {
    expect(calculateResidenceDuration("2024-01-15")).toBe("5ヶ月");
  });

  it("returns years only when months are exactly divisible", () => {
    expect(calculateResidenceDuration("2023-06-15")).toBe("1年");
  });

  it("returns years and months for mixed duration", () => {
    expect(calculateResidenceDuration("2023-01-15")).toBe("1年5ヶ月");
  });

  it("returns null for null input", () => {
    expect(calculateResidenceDuration(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(calculateResidenceDuration(undefined)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(calculateResidenceDuration("invalid")).toBeNull();
  });
});

describe("truncateText", () => {
  it("returns original text when shorter than maxLength", () => {
    expect(truncateText("Hello", 10)).toBe("Hello");
  });

  it("returns original text when equal to maxLength", () => {
    expect(truncateText("Hello", 5)).toBe("Hello");
  });

  it("truncates text and adds ellipsis when longer", () => {
    expect(truncateText("Hello World", 5)).toBe("Hello...");
  });

  it("handles empty string", () => {
    expect(truncateText("", 5)).toBe("");
  });

  it("handles maxLength of 0", () => {
    expect(truncateText("Hello", 0)).toBe("...");
  });
});

describe("parseInterests", () => {
  it("parses comma-separated interests", () => {
    expect(parseInterests("料理, 映画, ランニング")).toEqual([
      "料理",
      "映画",
      "ランニング",
    ]);
  });

  it("parses Japanese comma-separated interests", () => {
    expect(parseInterests("料理、映画、ランニング")).toEqual([
      "料理",
      "映画",
      "ランニング",
    ]);
  });

  it("handles mixed comma types", () => {
    expect(parseInterests("料理, 映画、ランニング")).toEqual([
      "料理",
      "映画",
      "ランニング",
    ]);
  });

  it("trims whitespace from interests", () => {
    expect(parseInterests("  料理  ,  映画  ")).toEqual(["料理", "映画"]);
  });

  it("filters out empty interests", () => {
    expect(parseInterests("料理,,映画")).toEqual(["料理", "映画"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseInterests("")).toEqual([]);
  });

  it("handles single interest", () => {
    expect(parseInterests("料理")).toEqual(["料理"]);
  });
});

describe("formatInterests", () => {
  it("formats interests array to comma-separated string", () => {
    expect(formatInterests(["料理", "映画", "ランニング"])).toBe(
      "料理, 映画, ランニング"
    );
  });

  it("filters out falsy values", () => {
    expect(formatInterests(["料理", "", "映画"])).toBe("料理, 映画");
  });

  it("returns empty string for empty array", () => {
    expect(formatInterests([])).toBe("");
  });

  it("handles single interest", () => {
    expect(formatInterests(["料理"])).toBe("料理");
  });
});
