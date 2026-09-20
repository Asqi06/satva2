/**
 * URL slug helpers. Slugs are lowercase, hyphen-separated, and unique
 * per collection (uniqueness enforced by the service layer, not here).
 */

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || "item";
}

/**
 * Append -2, -3, … until `exists` returns false.
 * `exists` performs the DB lookup (e.g. slug or SKU collision check).
 */
export async function ensureUnique(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Could not generate a unique value for "${base}"`);
}
