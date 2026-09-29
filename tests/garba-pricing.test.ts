import { describe, expect, it } from "vitest";
import { garbaDiscount, garbaMarginSafe } from "@/lib/garba-pricing";
import { GARBA_OFFERS, garbaOfferIndex } from "@/lib/garba-offers";

const line = (qty: number, unitPrice: number, productId = "selected") => ({ qty, unitPrice, productId });

describe("Garba Ghumar reward rules", () => {
  it("sells one exact bundle without discounting extra units", () => {
    expect(garbaDiscount(0, [line(4, 149)], [])).toBe(197);
    expect(garbaDiscount(0, [line(5, 149)], [])).toBeNull();
    expect(garbaDiscount(3, [line(2, 149)], [])).toBe(49);
    expect(garbaDiscount(3, [line(1, 149)], [])).toBeNull();
    expect(garbaDiscount(0, [line(4, 70)], [])).toBeNull();
  });
  it("makes only the cheapest of three pieces free, including repeated products", () => {
    expect(garbaDiscount(1, [line(2, 199), line(1, 149, "other")], [])).toBe(149);
    expect(garbaDiscount(1, [line(3, 149)], [])).toBe(149);
    expect(garbaDiscount(1, [line(6, 149)], [])).toBeNull();
  });
  it("calculates 50% off in integer rupees and enforces the 599 threshold", () => {
    expect(garbaDiscount(2, [line(1, 299)], [])).toBe(149);
    expect(garbaDiscount(5, [line(1, 598)], [])).toBeNull();
    expect(garbaDiscount(5, [line(1, 599)], [])).toBe(150);
  });
  it("requires a separate single gift that cannot count toward spend or piece requirements", () => {
    expect(garbaDiscount(4, [line(1, 499)], [line(1, 199, "gift")])).toBe(199);
    expect(garbaDiscount(4, [line(1, 498)], [line(1, 199, "gift")])).toBeNull();
    expect(garbaDiscount(4, [line(1, 499)], [line(2, 199, "gift")])).toBeNull();
    expect(garbaDiscount(6, [line(2, 149)], [line(1, 99, "gift")])).toBeNull();
    expect(garbaDiscount(6, [line(3, 149)], [line(1, 99, "gift")])).toBe(99);
    expect(garbaDiscount(6, [line(3, 149)], [])).toBeNull();
  });
  it("reserves stated costs, fees/tax and at least 25 rupees contribution", () => {
    expect(garbaMarginSafe(399, 4)).toBe(true);
    expect(garbaMarginSafe(249, 2)).toBe(true);
    expect(garbaMarginSafe(150, 1)).toBe(true);
    expect(garbaMarginSafe(75, 1)).toBe(false);
    expect(garbaMarginSafe(449, 6)).toBe(false);
    expect(garbaMarginSafe(298, 3)).toBe(true);
  });
  it("maps all 100 possible tickets exactly to the published odds", () => {
    const counts = Array(7).fill(0);
    for (let ticket = 0; ticket < 100; ticket++) counts[garbaOfferIndex(ticket)]++;
    expect(counts).toEqual(GARBA_OFFERS.map(offer => offer.chance));
    expect(() => garbaOfferIndex(-1)).toThrow();
    expect(() => garbaOfferIndex(100)).toThrow();
  });
});
