# SEO revision validation

**1 October 2026.** The checks below validate this working-tree revision, not a deployed SEO or ranking improvement. All application tests/builds used disposable MongoDB data; the production catalogue and orders were not edited.

| Check | Final result |
|---|---|
| `npm test -- --maxWorkers=2` | **41 files, 241 tests passed** |
| `npm run typecheck` | **Passed** |
| `npm run lint` | **0 errors**; one existing React Hook Form/React Compiler compatibility warning in ProductForm |
| SEO/content/shop/mobile Playwright checks | **18 passed** against an isolated database at port 3104 |
| `node audit/validate-build.mjs` | **Production build passed** with disposable replica-set database and isolated `.next-seo-audit` output |
| Production HTTP smoke | **Passed**: home, about, contact, guide, robots, sitemap and feed 200; missing product 404 for Googlebot |
| Production identity/indexing smoke | **Passed**: www canonical URLs, OnlineStore + official social profile, public sitemap pointer; no unintended production noindex |
| `git diff --check` | **Passed** |

New focused unit coverage verifies preview noindex, factual product fallback descriptions, invalid legacy SKU exclusion, variant schema URLs/prices/stock, category redirects retaining filters, collection lists/breadcrumbs, image sitemap coverage, verified business identity and settings persistence, URL validation and escaped SKU-specific merchant feed output.

New browser coverage verifies server HTML business identity and guide, sitemap guide inclusion, real fixture variant feed selection/availability, online-only contact text, one main/H1, no guide overflow and actual computed 44 px mobile header targets. Existing checks also cover product variants, real missing-page responses, ten mobile routes, cart dialog keyboard behavior, shop/API guards and contact/newsletter content.

The first browser attempt found port 3100 already occupied. The test runner now accepts `E2E_PORT` and `E2E_DIST_DIR`; its defaults remain unchanged. It used a separate port/output directory for this task rather than taking over that server.

The prescribed `vibe-check` was attempted before validation and again after the first build error, but the command is unavailable on PATH. Initial restricted-network validation could not download configured Google Fonts; rerunning isolated build/browser validation with network access succeeded. No font design or application logic rewrite was needed for that environment restriction.

An intermediate parallel build/full-test run exhausted temporary MongoDB disk capacity and caused an existing UI-test timeout. After the build completed, running the full suite with two workers passed all 241 tests. Generated isolated build files initially entered ESLint's scan; the dedicated `.next-seo-*` directories are now correctly excluded. No source errors were concealed by that ignore rule. Automatic task-specific Next type include additions were removed from tsconfig after validation; its original configuration is retained.

Live audit evidence remains separate: the 111-URL crawl and screenshots describe production before these local fixes. PageSpeed returned quota errors; live CWV, Google rich-result approval, Search Console indexing, rankings, GA4 sales, backlink metrics and AI citations are not verified here. Real legacy variant SKU data and merchant identity/policies still need owner review.
