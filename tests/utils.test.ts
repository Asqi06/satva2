import { describe, expect, it } from "vitest";
import { ensureUnique, slugify } from "@/utils/slug";
import { formatINR } from "@/utils/format";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Ivory Ember Bracelet")).toBe("ivory-ember-bracelet");
  });

  it("strips punctuation and diacritics", () => {
    expect(slugify("  Kundan—Polki (Set)! ")).toBe("kundan-polki-set");
  });

  it("falls back for empty input", () => {
    expect(slugify("!!!")).toBe("item");
  });
});

describe("ensureUnique", () => {
  it("returns base when free, suffixes on collision", async () => {
    const taken = new Set(["ring", "ring-2"]);
    const result = await ensureUnique("ring", async (c) => taken.has(c));
    expect(result).toBe("ring-3");
    expect(await ensureUnique("bangle", async (c) => taken.has(c))).toBe("bangle");
  });
});

describe("formatINR", () => {
  it("formats whole rupees in en-IN", () => {
    expect(formatINR(999)).toContain("999");
    expect(formatINR(100000)).toContain("1,00,000");
  });
});
