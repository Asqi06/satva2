import { jsonLd } from "@/utils/jsonld";
import { describe, expect, it } from "vitest";
import { ensureUnique, slugify } from "@/utils/slug";
import { formatINR } from "@/utils/format";
import { cloudinaryLoader, cloudinaryPublicId } from "@/utils/cloudinary-url";

it("serializes hostile catalogue copy without closing a script element", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const serialized = jsonLd(value);
  expect(serialized).not.toContain("<");
  expect(JSON.parse(serialized)).toEqual(value);
});

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

describe("cloudinaryLoader", () => {
  it("generates width-specific CDN URLs with automatic format and quality", () => {
    const src = "https://res.cloudinary.com/store/image/upload/v1/ring.png";
    expect(cloudinaryLoader({ src, width: 384 })).toBe("https://res.cloudinary.com/store/image/upload/f_auto,q_auto,w_384/v1/ring.png");
    expect(cloudinaryLoader({ src, width: 750 })).toContain("w_750/");
  });
});

describe("cloudinaryPublicId", () => {
  it("recovers the original image ID from migrated versioned URLs", () => {
    expect(cloudinaryPublicId("https://res.cloudinary.com/store/image/upload/v1777711970/rglj3nkhqg8unjmakssj.jpg")).toBe("rglj3nkhqg8unjmakssj");
    expect(cloudinaryPublicId("https://res.cloudinary.com/store/image/upload/f_auto,q_auto/v1/products/silver%20ring.front.png")).toBe("products/silver ring.front");
  });

  it("does not guess IDs for invalid, foreign or ambiguous URLs", () => {
    for (const url of [
      "not a URL",
      "https://example.com/store/image/upload/v1/ring.jpg",
      "https://res.cloudinary.com.evil.test/store/image/upload/v1/ring.jpg",
      "http://res.cloudinary.com/store/image/upload/v1/ring.jpg",
      "https://user:password@res.cloudinary.com/store/image/upload/v1/ring.jpg",
      "https://res.cloudinary.com/store/image/upload/ring.jpg",
      "https://res.cloudinary.com/store/video/upload/v1/ring.mp4",
      "https://res.cloudinary.com/store/image/upload/v1/%ZZ.jpg",
    ]) expect(cloudinaryPublicId(url)).toBe("");
  });
});
