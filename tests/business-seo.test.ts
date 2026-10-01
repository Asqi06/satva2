import { describe, expect, it } from "vitest";
import { businessAddressText, businessSeoInputSchema, getBusinessSchema } from "@/lib/business-seo";

const localAddress = { addressStreet: "Verified street", addressLocality: "Vapi", addressRegion: "Gujarat", addressPostalCode: "396191" };

describe("verified business identity", () => {
  it("describes online-only Vapi operations without inventing a shop or full street address", () => {
    const settings = { addressLocality: "Vapi", addressRegion: "Gujarat", physicalStore: false, sameAs: ["https://www.instagram.com/satvastonesjewelry/"] };
    const schema = getBusinessSchema(settings, "https://satvastones.in/");
    expect(schema["@type"]).toBe("OnlineStore");
    expect(schema["@id"]).toBe("https://satvastones.in/#organization");
    expect(schema).toHaveProperty("address", { "@type": "PostalAddress", addressLocality: "Vapi", addressRegion: "Gujarat", addressCountry: "IN" });
    expect(businessAddressText(settings)).toBe("Vapi, Gujarat, India");
    expect(schema).not.toHaveProperty("geo");
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("logo");
    expect(schema).not.toHaveProperty("openingHoursSpecification");
  });

  it("requires opt-in, a complete address and contact phone for local store schema", () => {
    for (const settings of [localAddress, { ...localAddress, physicalStore: true }, { addressLocality: "Vapi", physicalStore: true, supportPhone: "+919876543210" }]) {
      expect(getBusinessSchema(settings, "https://satvastones.in")["@type"]).toBe("OnlineStore");
    }
    expect(getBusinessSchema({ ...localAddress, physicalStore: true, supportPhone: "+919876543210" }, "https://satvastones.in")["@type"]).toEqual(["OnlineStore", "JewelryStore"]);
  });

  it("uses the same complete structured address for schema and visible NAP", () => {
    const settings = { ...localAddress, businessAddress: "Legacy address" };
    expect(businessAddressText(settings)).toBe("Verified street, Vapi, Gujarat, 396191, India");
    expect(getBusinessSchema(settings, "https://satvastones.in")).toHaveProperty("address", { "@type": "PostalAddress", streetAddress: "Verified street", addressLocality: "Vapi", addressRegion: "Gujarat", postalCode: "396191", addressCountry: "IN" });
    expect(businessAddressText({ addressLocality: "Vapi", businessAddress: "Legacy address" })).toBe("Legacy address");
  });

  it("validates HTTPS profile URLs and rejects unsafe protocols or credentials", () => {
    for (const value of ["javascript:alert(1)", "http://instagram.com/brand", "https://user:password@example.com", "not a URL"]) {
      expect(businessSeoInputSchema.safeParse({ sameAs: [value] }).success).toBe(false);
    }
    expect(businessSeoInputSchema.parse({ sameAs: [" https://www.instagram.com/satvastonesjewelry/ "] }).sameAs).toEqual(["https://www.instagram.com/satvastonesjewelry/"]);
    expect(getBusinessSchema({ sameAs: ["javascript:alert(1)"] }, "https://satvastones.in")).not.toHaveProperty("sameAs");
  });

  it("validates Google Maps links without accepting lookalike hosts", () => {
    for (const value of ["not a URL", "https://google.com.evil.test/maps", "https://example.com/maps", "http://maps.google.com/", "https://google.com/search"]) {
      expect(businessSeoInputSchema.safeParse({ googleMapsUrl: value }).success).toBe(false);
    }
    for (const value of ["https://www.google.com/maps/place/Vapi", "https://maps.app.goo.gl/abc", ""]) {
      expect(businessSeoInputSchema.safeParse({ googleMapsUrl: value }).success).toBe(true);
    }
    expect(getBusinessSchema({ googleMapsUrl: "https://www.google.com/maps/place/Vapi" }, "https://satvastones.in")).not.toHaveProperty("hasMap");
  });

  it("allows explicit clearing while omitted fields remain absent for legacy-client preservation", () => {
    expect(businessSeoInputSchema.parse({ freeShippingThreshold: 399 })).toEqual({});
    expect(businessSeoInputSchema.parse({ sameAs: [], addressLocality: "", googleMapsUrl: "", physicalStore: false })).toEqual({ sameAs: [], addressLocality: "", googleMapsUrl: "", physicalStore: false });
    expect(businessSeoInputSchema.safeParse({ addressPostalCode: "012345" }).success).toBe(false);
    expect(businessSeoInputSchema.safeParse({ addressPostalCode: "396191" }).success).toBe(true);
  });
});
