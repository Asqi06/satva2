import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ update: vi.fn(), lean: vi.fn(), connect: vi.fn() }));
vi.mock("@/lib/db", () => ({ connectDb: mocks.connect }));
vi.mock("@/models/Settings", () => ({ Settings: { findOneAndUpdate: mocks.update, findOne: () => ({ lean: mocks.lean }) } }));

import { getSettings, updateSettings } from "@/services/settings-service";

const shipping = { freeShippingThreshold: 399, shippingFlatFee: 49, reservationTtlMinutes: 30 };

describe("business configuration persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lean.mockResolvedValue(undefined);
  });

  it("uses only verified owner defaults when no settings document exists", async () => {
    const settings = await getSettings();
    expect(settings.addressLocality).toBe("Vapi");
    expect(settings.addressRegion).toBe("Gujarat");
    expect(settings.physicalStore).toBe(false);
    expect(settings.sameAs).toEqual(["https://www.instagram.com/satvastonesjewelry/"]);
    expect(settings.addressStreet).toBeUndefined();
    expect(settings.addressPostalCode).toBeUndefined();
  });

  it("does not overwrite new configuration when an older admin client omits fields", async () => {
    await updateSettings(shipping);
    const update = mocks.update.mock.calls[0][1].$set;
    for (const key of ["addressStreet", "addressLocality", "addressRegion", "addressPostalCode", "physicalStore", "googleMapsUrl", "sameAs"]) {
      expect(update).not.toHaveProperty(key);
    }
  });

  it("stores explicitly supplied values and supports clearing profiles", async () => {
    await updateSettings({ ...shipping, addressLocality: " Vapi ", addressRegion: "Gujarat", sameAs: [], physicalStore: false, googleMapsUrl: "" });
    expect(mocks.update.mock.calls[0][1].$set).toMatchObject({ addressLocality: "Vapi", addressRegion: "Gujarat", sameAs: [], physicalStore: false, googleMapsUrl: "" });
    mocks.lean.mockResolvedValue({ ...shipping, sameAs: [], addressLocality: "", addressRegion: "" });
    expect((await getSettings()).sameAs).toEqual([]);
  });

  it("rejects invalid SEO settings before making a database write", async () => {
    await expect(updateSettings({ ...shipping, sameAs: ["javascript:alert(1)"] })).rejects.toThrow();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
