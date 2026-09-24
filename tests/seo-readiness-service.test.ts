import type { TypeSafeClient } from "@typesafe-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTypesafeClient, isTypesafeConfigured } from "@/lib/typesafe";
import {
  assessProductSeo,
  compositeScore,
  runSeoChecks,
  type SeoPageInput,
} from "@/services/seo-readiness-service";

vi.mock("@/lib/typesafe", () => ({
  isTypesafeConfigured: vi.fn(),
  getTypesafeClient: vi.fn(),
}));

const mockIsConfigured = vi.mocked(isTypesafeConfigured);
const mockGetClient = vi.mocked(getTypesafeClient);

function baseInput(overrides: Partial<SeoPageInput> = {}): SeoPageInput {
  return {
    url: "https://www.satvastones.in/products/ivory-ember-bracelet",
    title: "Ivory Ember Bracelet | SatvaStones",
    metaDescription:
      "Gold-toned anti-tarnish bracelet for everyday wear in India. Free shipping over ₹399, gift-ready packing from Vapi, Gujarat.",
    h1: "Ivory Ember Bracelet",
    bodyText: `${"Handcrafted everyday bracelet. ".repeat(60)}`,
    imageAlts: ["Ivory Ember Bracelet on wrist", "Clasp detail"],
    jsonLdTypes: ["Product", "BreadcrumbList"],
    canonical: "https://www.satvastones.in/products/ivory-ember-bracelet",
    reviewCount: 12,
    ratingAverage: 4.6,
    categoryName: "Bracelets",
    ...overrides,
  };
}

function mockAnswers(scores: { score: number; confidence: number }[]) {
  const ids = ["content_depth", "title_appeal", "trust_completeness"] as const;
  const answers: Record<string, unknown> = {};
  ids.forEach((id, i) => {
    answers[id] = {
      type: "score",
      score: scores[i]?.score ?? 0,
      confidence: scores[i]?.confidence ?? 0.9,
      legend: {},
      probabilities: {},
    };
  });
  return {
    model: "jev-test",
    answers,
    usage: { input_tokens: 100, output_tokens: 10 },
  };
}

describe("seo-readiness-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs deterministic checks without inference", () => {
    const checks = runSeoChecks(
      baseInput({ metaDescription: "", imageAlts: ["", "ok"], reviewCount: 0 }),
    );
    const byId = new Map(checks.map((c) => [c.id, c]));
    expect(byId.get("meta-length")?.pass).toBe(false);
    expect(byId.get("alt-coverage")?.pass).toBe(false);
    expect(byId.has("review-volume")).toBe(false);
    expect(byId.get("canonical")?.pass).toBe(true);
  });

  it("combines Jev dimensions and checks with owned weights", () => {
    const full = compositeScore(
      [
        { id: "content_depth", score01: 1 },
        { id: "title_appeal", score01: 1 },
        { id: "trust_completeness", score01: 1 },
      ],
      [
        { id: "a", label: "a", pass: true, detail: "" },
        { id: "b", label: "b", pass: true, detail: "" },
      ],
    );
    // 0.35 + 0.25 + 0.2 + 0.2*1 = 1.0 → 100
    expect(full).toBe(100);
    const empty = compositeScore(
      [
        { id: "content_depth", score01: 0 },
        { id: "title_appeal", score01: 0 },
        { id: "trust_completeness", score01: 0 },
      ],
      [{ id: "a", label: "a", pass: false, detail: "" }],
    );
    expect(empty).toBe(0);
  });

  it("returns UNAVAILABLE without a key (checks only, no inference)", async () => {
    mockIsConfigured.mockReturnValue(false);
    const report = await assessProductSeo(baseInput());
    expect(report.available).toBe(false);
    expect(report.verdict).toBe("UNAVAILABLE");
    expect(report.dimensions).toHaveLength(0);
    expect(report.checks.length).toBeGreaterThan(0);
    expect(mockGetClient).not.toHaveBeenCalled();
  });

  it("scores READY on strong, confident dimensions", async () => {
    mockIsConfigured.mockReturnValue(true);
    const systemOne = vi.fn().mockResolvedValue(
      mockAnswers([
        { score: 2.7, confidence: 0.9 },
        { score: 2.5, confidence: 0.85 },
        { score: 2.8, confidence: 0.95 },
      ]),
    );
    mockGetClient.mockReturnValue({ systemOne } as unknown as TypeSafeClient);
    const report = await assessProductSeo(baseInput());
    expect(report.available).toBe(true);
    expect(report.model).toBe("jev-test");
    expect(report.dimensions).toHaveLength(3);
    expect(report.dimensions.every((d) => !d.uncertain)).toBe(true);
    expect(report.verdict).toBe("READY");
    expect(report.score).toBeGreaterThanOrEqual(70);
    expect(systemOne).toHaveBeenCalledTimes(1);
    // One request carries all three questions (parallel, not sequential).
    const questions = Object.keys(systemOne.mock.calls[0][0].questions);
    expect(questions).toEqual(["content_depth", "title_appeal", "trust_completeness"]);
  });

  it("caps at NEEDS_WORK when confidence is low (human-review flags)", async () => {
    mockIsConfigured.mockReturnValue(true);
    const systemOne = vi.fn().mockResolvedValue(
      mockAnswers([
        { score: 3, confidence: 0.2 },
        { score: 3, confidence: 0.2 },
        { score: 3, confidence: 0.9 },
      ]),
    );
    mockGetClient.mockReturnValue({ systemOne } as unknown as TypeSafeClient);
    const report = await assessProductSeo(baseInput());
    expect(report.verdict).toBe("NEEDS_WORK");
    expect(report.dimensions.filter((d) => d.uncertain)).toHaveLength(2);
  });

  it("wraps Jev transport failures as 502 AppErrors", async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetClient.mockReturnValue({
      systemOne: vi.fn().mockRejectedValue(new Error("timeout")),
    } as unknown as TypeSafeClient);
    await expect(assessProductSeo(baseInput())).rejects.toMatchObject({ status: 502 });
  });
});
