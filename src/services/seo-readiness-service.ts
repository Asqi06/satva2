import { score, type JsonValue } from "@typesafe-ai/sdk";
import { AppError } from "@/lib/errors";
import { getTypesafeClient, isTypesafeConfigured } from "@/lib/typesafe";

/**
 * Jev-powered SEO readiness scoring for product pages.
 *
 * Pattern: composite scoring (TypeSafe docs). Three narrow Score questions
 * run in ONE systemOne request over the same page state; code normalizes
 * each to 0–1 and combines with weights it owns. Deterministic checks
 * (canonical shape, lengths, alt coverage) stay in code — inference is
 * spent only where semantic judgment helps.
 *
 * This is a readiness score (0–100), NOT a ranking probability. Jev sees
 * the page, not Google's index, competitors, or backlinks — no model can
 * output P(rank #1) from page state alone.
 */

export interface SeoPageInput {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodyText: string;
  imageAlts: string[];
  jsonLdTypes: string[];
  canonical: string;
  reviewCount: number;
  ratingAverage: number;
  categoryName: string;
}

export interface SeoDimension {
  id: "content_depth" | "title_appeal" | "trust_completeness";
  label: string;
  /** Normalized 0–1 (Jev score ÷ top level). */
  score01: number;
  confidence: number;
  /** True when confidence < 0.4 — needs a human eye, not blind trust. */
  uncertain: boolean;
}

export interface SeoCheck {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface SeoReadinessReport {
  available: boolean;
  /** 0–100 composite. Meaningless when available is false. */
  score: number;
  verdict: "READY" | "NEEDS_WORK" | "UNAVAILABLE";
  dimensions: SeoDimension[];
  checks: SeoCheck[];
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
  note: string;
}

const CONFIDENCE_FLOOR = 0.4;

/** Weights live in code — retune here when rankings disagree with the team. */
const WEIGHTS: Record<SeoDimension["id"], number> = {
  content_depth: 0.35,
  title_appeal: 0.25,
  trust_completeness: 0.2,
};
const CHECKS_WEIGHT = 0.2;

const QUESTIONS = {
  content_depth: score(
    "How comprehensively does this product page answer a jewellery buyer's pre-purchase questions (what it is, material, size/fit, care, delivery, gifting)?",
    [
      "Bare listing: product name and price only, no useful description",
      "Basic: short description plus a few specs, leaves buyer questions open",
      "Solid: full description, specs, material and care, shipping and gifting covered",
      "Buying-guide depth: everything above plus occasion styling, authenticity cues, and answered FAQs",
    ],
  ),
  title_appeal: score(
    "How click-worthy are this page title and meta description in jewellery search results?",
    [
      "Generic or duplicated: could belong to any product on any site",
      "Clear but plain: names the product, no reason to prefer it",
      "Specific with a differentiator: price, style, or origin stands out",
      "Irresistible: specific, proof-backed (reviews, price, origin) and clearly matched to buyer intent",
    ],
  ),
  trust_completeness: score(
    "How completely does this page reassure a first-time Indian online jewellery buyer (payments, shipping, returns, authenticity, contact)?",
    [
      "No reassurance: buy box only, nothing about delivery, payment safety, or returns",
      "One pillar: mentions payments or shipping, the rest missing",
      "Most pillars: delivery timelines, payment methods, and returns covered",
      "Complete: delivery, UPI/cards clarity, COD policy honesty, gift packing, authenticity, reviews, and support contact",
    ],
  ),
} as const;

type DimensionId = keyof typeof QUESTIONS;

const DIMENSION_LABELS: Record<DimensionId, string> = {
  content_depth: "Content depth",
  title_appeal: "Title appeal",
  trust_completeness: "Trust completeness",
};

/** Keep inference cheap: Jev needs signal, not the full page. */
function truncate(text: string, max = 2000): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function buildSeoState(input: SeoPageInput): Record<string, JsonValue> {
  return {
    page: {
      url: input.url,
      title: input.title,
      meta_description: input.metaDescription,
      h1: input.h1,
      category: input.categoryName,
    },
    copy: { body_text: truncate(input.bodyText) },
    media: {
      image_count: input.imageAlts.length,
      images_missing_alt: input.imageAlts.filter((a) => !a.trim()).length,
    },
    structured: { json_ld_types: input.jsonLdTypes, canonical: input.canonical },
    social_proof: { review_count: input.reviewCount, rating_average: input.ratingAverage },
  };
}

/** Pure-code checks — no inference spent on what regex can answer. */
export function runSeoChecks(input: SeoPageInput): SeoCheck[] {
  const missingAlt = input.imageAlts.filter((a) => !a.trim()).length;
  return [
    {
      id: "canonical",
      label: "Absolute HTTPS canonical",
      pass: /^https:\/\//.test(input.canonical),
      detail: input.canonical || "(missing)",
    },
    {
      id: "title-length",
      label: "Descriptive title present",
      pass: input.title.trim().length > 0,
      detail: `${input.title.length} chars`,
    },
    {
      id: "meta-length",
      label: "Meta description present",
      pass: input.metaDescription.trim().length > 0,
      detail: `${input.metaDescription.length} chars`,
    },
    {
      id: "h1",
      label: "Single descriptive H1",
      pass: input.h1.trim().length > 0,
      detail: input.h1.trim() || "(missing)",
    },
    {
      id: "jsonld",
      label: "Product + Offer structured data",
      pass: input.jsonLdTypes.includes("Product"),
      detail: input.jsonLdTypes.join(", ") || "(none)",
    },
    {
      id: "alt-coverage",
      label: "All product images have alt text",
      pass: input.imageAlts.length > 0 && missingAlt === 0,
      detail: `${input.imageAlts.length - missingAlt}/${input.imageAlts.length} with alt`,
    },
    {
      id: "copy-depth",
      label: "Product description present",
      pass: input.bodyText.trim().length > 0,
      detail: `${input.bodyText.trim().length} characters`,
    },
  ];
}

export function compositeScore(
  dimensions: { id: DimensionId; score01: number }[],
  checks: SeoCheck[],
): number {
  const jevPart = dimensions.reduce((n, d) => n + WEIGHTS[d.id] * d.score01, 0);
  const checkRate = checks.length > 0 ? checks.filter((c) => c.pass).length / checks.length : 0;
  return Math.round((jevPart + CHECKS_WEIGHT * checkRate) * 100);
}

export async function assessProductSeo(input: SeoPageInput): Promise<SeoReadinessReport> {
  if (!isTypesafeConfigured()) {
    return {
      available: false,
      score: 0,
      verdict: "UNAVAILABLE",
      dimensions: [],
      checks: runSeoChecks(input),
      model: "none",
      note: "TYPESAFE_API_KEY is not set — deterministic checks only, no Jev judgments.",
    };
  }

  const client = getTypesafeClient();
  let response;
  try {
    response = await client.systemOne({ state: buildSeoState(input), questions: QUESTIONS });
  } catch (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      error instanceof Error ? `Jev request failed: ${error.message}` : "Jev request failed",
      502,
    );
  }

  const dimensions: SeoDimension[] = (Object.keys(QUESTIONS) as DimensionId[]).map((id) => {
    const answer = response.answers[id];
    const topLevel = QUESTIONS[id].criteria.length - 1;
    const score01 = Math.min(1, Math.max(0, answer.score / topLevel));
    return {
      id,
      label: DIMENSION_LABELS[id],
      score01: Math.round(score01 * 100) / 100,
      confidence: Math.round(answer.confidence * 100) / 100,
      uncertain: answer.confidence < CONFIDENCE_FLOOR,
    };
  });

  const checks = runSeoChecks(input);
  const score = compositeScore(dimensions, checks);
  const uncertainCount = dimensions.filter((d) => d.uncertain).length;
  const verdict: SeoReadinessReport["verdict"] =
    uncertainCount >= 2 ? "NEEDS_WORK" : score >= 70 ? "READY" : "NEEDS_WORK";

  return {
    available: true,
    score,
    verdict,
    dimensions,
    checks,
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    note:
      uncertainCount > 0
        ? `${uncertainCount} dimension(s) below confidence ${CONFIDENCE_FLOOR} — treat as human-review flags, not decisions.`
        : "All dimensions above the confidence floor.",
  };
}
