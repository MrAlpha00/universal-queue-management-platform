import { describe, expect, it } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  initials,
  isRecord,
  safeJsonParse,
  slugify,
  truncate,
} from "@/lib/utils";

describe("slugify", () => {
  it("normalizes accents, punctuation and casing", () => {
    expect(slugify("Café de l'Été")).toBe("cafe-de-l-ete");
    expect(slugify("  North   Side Clinic  ")).toBe("north-side-clinic");
  });

  it("limits slugs to 60 characters", () => {
    expect(slugify("a".repeat(120))).toHaveLength(60);
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("✦ ✦")).toBe("");
  });
});

describe("initials", () => {
  it("uses the first two name parts", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });

  it("falls back to email local parts", () => {
    expect(initials(null, "grace.hopper@example.com")).toBe("GH");
  });

  it("handles a single name and a missing name", () => {
    expect(initials("Cher")).toBe("C");
    expect(initials(null, null)).toBe("?");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("adds a single ellipsis when truncating", () => {
    expect(truncate("abcdefghijkl", 10)).toBe("abcdefghi…");
  });
});

describe("number formatting", () => {
  it("formats whole currency amounts", () => {
    expect(formatCurrency(1234)).toBe("$1,234");
    expect(formatCurrency(99.5)).toBe("$100");
  });

  it("formats grouped integers", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"ok":true}', { ok: false })).toEqual({ ok: true });
  });

  it("returns the fallback for invalid or non-string values", () => {
    expect(safeJsonParse("{nope", { ok: false })).toEqual({ ok: false });
    expect(safeJsonParse(42, [])).toEqual([]);
  });
});

describe("isRecord", () => {
  it("accepts plain objects only", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("value")).toBe(false);
  });
});

describe("cn", () => {
  it("merges conflicting Tailwind utilities", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
