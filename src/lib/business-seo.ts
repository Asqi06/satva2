import { z } from "zod";

const httpsUrl = z.string().trim().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Enter a public HTTPS URL");

const mapsUrl = httpsUrl.refine((value) => {
  try {
    const url = new URL(value);
    return url.hostname === "maps.app.goo.gl"
      || (url.hostname === "goo.gl" && url.pathname.startsWith("/maps"))
      || (["google.com", "www.google.com", "maps.google.com"].includes(url.hostname)
        && (url.hostname === "maps.google.com" || url.pathname.startsWith("/maps")));
  } catch {
    return false;
  }
}, "Enter a Google Maps place or directions URL");

/** Empty strings explicitly clear fields; omitted fields preserve existing configuration. */
export const businessSeoInputSchema = z.object({
  addressStreet: z.string().trim().max(500).optional(),
  addressLocality: z.string().trim().max(200).optional(),
  addressRegion: z.string().trim().max(200).optional(),
  addressPostalCode: z.string().trim().refine((value) => !value || /^[1-9]\d{5}$/.test(value), "Enter a six-digit Indian PIN code").optional(),
  physicalStore: z.boolean().optional(),
  googleMapsUrl: z.union([z.literal(""), mapsUrl]).optional(),
  sameAs: z.array(httpsUrl).max(20).optional(),
});

export type BusinessSeoSettings = z.infer<typeof businessSeoInputSchema> & {
  businessAddress?: string;
  legalName?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export function hasStructuredBusinessAddress(settings: BusinessSeoSettings): boolean {
  return Boolean(settings.addressStreet?.trim() && settings.addressLocality?.trim()
    && settings.addressRegion?.trim() && /^[1-9]\d{5}$/.test(settings.addressPostalCode?.trim() ?? ""));
}

/** One display address also feeds structured data, avoiding conflicting NAP sources. */
export function businessAddressText(settings: BusinessSeoSettings): string | undefined {
  return hasStructuredBusinessAddress(settings)
    ? [settings.addressStreet, settings.addressLocality, settings.addressRegion, settings.addressPostalCode, "India"].map((value) => value?.trim()).join(", ")
    : settings.businessAddress?.trim() || ([settings.addressLocality?.trim(), settings.addressRegion?.trim()].filter(Boolean).length
      ? [...[settings.addressLocality?.trim(), settings.addressRegion?.trim()].filter(Boolean), "India"].join(", ") : undefined);
}

export function getBusinessSchema(settings: BusinessSeoSettings, baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");
  const local = settings.physicalStore === true && hasStructuredBusinessAddress(settings) && Boolean(settings.supportPhone?.trim());
  const sameAs = (settings.sameAs ?? []).filter((value) => httpsUrl.safeParse(value).success);
  return {
    "@context": "https://schema.org",
    "@type": local ? ["OnlineStore", "JewelryStore"] : "OnlineStore",
    "@id": `${base}/#organization`,
    name: "SatvaStones",
    url: base,
    description: "Shop rings, earrings, necklaces, bracelets and other jewellery online in India.",
    ...(settings.legalName?.trim() ? { legalName: settings.legalName.trim() } : {}),
    ...(hasStructuredBusinessAddress(settings) ? { address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressStreet!.trim(),
      addressLocality: settings.addressLocality!.trim(),
      addressRegion: settings.addressRegion!.trim(),
      postalCode: settings.addressPostalCode!.trim(),
      addressCountry: "IN",
    } } : settings.businessAddress?.trim() ? { address: settings.businessAddress.trim() }
      : settings.addressLocality?.trim() || settings.addressRegion?.trim() ? { address: {
        "@type": "PostalAddress",
        ...(settings.addressLocality?.trim() ? { addressLocality: settings.addressLocality.trim() } : {}),
        ...(settings.addressRegion?.trim() ? { addressRegion: settings.addressRegion.trim() } : {}),
        addressCountry: "IN",
      } } : {}),
    ...(settings.supportEmail?.trim() ? { email: settings.supportEmail.trim() } : {}),
    ...(settings.supportPhone?.trim() ? { telephone: settings.supportPhone.trim() } : {}),
    ...(settings.supportEmail?.trim() || settings.supportPhone?.trim() ? { contactPoint: {
      "@type": "ContactPoint", contactType: "customer service",
      ...(settings.supportEmail?.trim() ? { email: settings.supportEmail.trim() } : {}),
      ...(settings.supportPhone?.trim() ? { telephone: settings.supportPhone.trim() } : {}),
    } } : {}),
    ...(sameAs.length ? { sameAs: [...new Set(sameAs.map((url) => url.trim()))] } : {}),
    ...(local && mapsUrl.safeParse(settings.googleMapsUrl).success ? { hasMap: settings.googleMapsUrl!.trim() } : {}),
  };
}
