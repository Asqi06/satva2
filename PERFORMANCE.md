# Performance Requirements

- Server Components by default; `"use client"` only where interactivity demands it.
- Images: Next.js `<Image>` + Cloudinary responsive transforms, lazy below fold, explicit sizes to avoid CLS.
- Data: indexed MongoDB queries, pagination everywhere (storefront + admin tables), no full-catalog loads, `select`/`lean` where appropriate.
- JS: avoid unnecessary client bundles; no new deps without justification (AGENTS.md).
- Caching: static generation for policies/about; ISR/revalidate for product/category pages; `Cache-Control` on public GET APIs where safe.

---

# Targets

Aim for strong Core Web Vitals on product + home pages:

- LCP ≤ 2.5s
- CLS ≤ 0.1
- INP ≤ 200ms

Measure with Lighthouse + Vercel Speed Insights before launch; fix regressions before merging.
