import { describe, expect, it } from "vitest";
import { merchantFeed, type FeedProduct } from "@/lib/merchant-feed";

const product: FeedProduct = {
  name: "Ring & pendant", slug: "ring", sku: "RING", description: "Actual <piece> details",
  price: 499, stock: 5, reservedStock: 1, variants: [],
  images: [{ publicId: "ring", secureUrl: "https://res.cloudinary.com/demo/ring.jpg", alt: "Ring", isThumbnail: true }],
};

describe("Merchant feed", () => {
  it("escapes catalogue content without inventing product identifiers or policies", () => {
    const feed = merchantFeed([product], "https://www.satvastones.in");
    expect(feed).toContain("Ring &amp; pendant");
    expect(feed).toContain("Actual &lt;piece&gt; details");
    expect(feed).toContain("499.00 INR");
    expect(feed).toContain("<g:availability>in_stock</g:availability>");
    for (const field of ["gtin", "brand", "mpn", "identifier_exists", "shipping", "condition"]) expect(feed).not.toContain(`<g:${field}>`);
  });

  it("selects each variant with exact prices and both stock limits", () => {
    const feed = merchantFeed([{ ...product, variants: [
      { sku: "RING&7", size: "7", stock: 2, price: 599 },
      { sku: "RING8", size: "8", stock: 2, reservedStock: 2 },
    ] }], "https://www.satvastones.in");
    expect(feed.match(/<item>/g)).toHaveLength(2);
    expect(feed).toContain("variant=RING%267");
    expect(feed).toContain("599.00 INR");
    expect(feed).toContain("<g:availability>out_of_stock</g:availability>");
    expect(feed.match(/<g:item_group_id>RING<\/g:item_group_id>/g)).toHaveLength(2);
    const parentSoldOut = merchantFeed([{ ...product, reservedStock: 5, variants: [{ sku: "RING7", size: "7", stock: 2 }] }], "https://www.satvastones.in");
    expect(parentSoldOut).not.toContain("<g:availability>in_stock</g:availability>");
  });

  it("skips invalid feed rows and avoids grouping style-only variants", () => {
    const feed = merchantFeed([{ ...product, variants: [{ sku: "A", style: "A", stock: 1 }, { sku: "B", style: "B", stock: 1 }] },
      { ...product, images: [] }, { ...product, price: 0 }, { ...product, description: "" }], "https://www.satvastones.in");
    expect(feed.match(/<item>/g)).toHaveLength(2);
    expect(feed).not.toContain("item_group_id");
  });

  it("never substitutes a parent SKU for malformed legacy variants", () => {
    const legacy = { ...product, variants: [{ size: "7", stock: 2 }, { sku: "", size: "8", stock: 2 }] } as FeedProduct;
    const feed = merchantFeed([legacy, { ...product, description: undefined } as unknown as FeedProduct], "https://www.satvastones.in");
    expect(feed).not.toContain("<item>");
    expect(feed).not.toContain("variant=undefined");
  });
});
