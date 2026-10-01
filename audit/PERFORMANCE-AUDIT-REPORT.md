# SatvaStones performance evidence

Live checks: 1 October 2026. Google PageSpeed API returned HTTP 429 quota errors for both mobile and desktop. **LCP, INP, CLS, Lighthouse and CrUX results are unavailable**; `PERFORMANCE-SUMMARY.json` records the errors. No numerical performance score has been inferred.

Source controls are good: responsive Cloudinary transformation, above-fold priority/preload, below-fold lazy loading, aspect-ratio boxes, font swap and lazy analytics. Four delivered images measured 10–87 KB and all were WebP with immutable caching (`IMAGE-SUMMARY.json`).

One shop response downloaded in 23.1 seconds and one product in 8.5 seconds during the bounded crawl. These are individual network observations, not Web Vitals or a reliable population latency distribution. Investigate cold starts, MongoDB queries and repeated public layout data. Root `headers()` and product review `auth()` explain dynamic rendering. Cache public data selectively; personalized review output must not become shared cache content.

Obtain authenticated PSI/CrUX data or a local Lighthouse run, then field-monitor mobile LCP/INP/CLS. The technical audit explains specific recommendations and limits in `TECHNICAL-FINDINGS.md`.
