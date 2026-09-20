# SEO

Every product must have: title, meta description, canonical URL, Open Graph metadata, structured data.

---

# Requirements

- Dynamic metadata via Next.js Metadata API (title templates, descriptions, OG images from Cloudinary).
- Readable URLs: `/products/ivory-ember-bracelet` — never `/product?id=928392`.
- `sitemap.xml` (products, categories, static pages) + `robots.txt`.
- JSON-LD: `Product` (price, availability, rating), `BreadcrumbList`, `Organization`.
- Category pages get curated metadata; unpublished products excluded from sitemap + return 404.
- Canonical URLs absolute (`NEXT_PUBLIC_APP_URL`); trailing-slash policy consistent.
- Images: descriptive `alt`, OG image 1200×630.
