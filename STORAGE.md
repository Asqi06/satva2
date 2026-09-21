# Image Storage (Cloudinary)

Provider: Cloudinary. MongoDB stores references only — never binary image files.

---

# What MongoDB Stores

Per image:

```text
publicId   — Cloudinary public ID (for transforms/deletion)
secureUrl  — HTTPS delivery URL
alt        — required alt text
width / height
isThumbnail
```

Videos: same pattern (`resource_type: video`).

---

# Upload Rules

- Uploads happen server-side — admin product form → API → Cloudinary. Never expose `CLOUDINARY_API_SECRET` to the browser.
- Two modes (`src/lib/cloudinary.ts`): signed (API keypair) or unsigned via `CLOUDINARY_UPLOAD_PRESET` (Signing Mode: Unsigned). Either the keypair or the preset must be set, or uploads return 503. Auth, type and size validation always run server-side first.
- Preset/folder convention: `satvastones/products/<slug>/...`. Predictable naming.
- On product delete: remove Cloudinary assets (or scheduled orphan cleanup).
- Responsive delivery: `f_auto,q_auto,w_<breakpoint>` transformations via Next.js `<Image>` + Cloudinary loader.

---

# Product Image Requirements

- Multiple images + thumbnail + gallery; optional product video; zoom on detail page.
- Optimized formats, appropriate sizes, lazy-loading below fold, `alt` text mandatory.
