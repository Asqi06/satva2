import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GarbaSpin } from "@/models/GarbaSpin";
import { Coupon } from "@/models/Coupon";
import mongoose from "mongoose";
import { createGarbaPayment, getGarbaStatus, verifyGarbaPayment } from "@/services/garba-service";
import { fetchRazorpayPayment, verifyPaymentSignature } from "@/lib/razorpay";

vi.mock("@/lib/db", () => ({ connectDb: vi.fn() }));
vi.mock("@/models/GarbaSpin", () => ({ GarbaSpin: { findOne: vi.fn() } }));
vi.mock("@/models/Coupon", () => ({ Coupon: { create: vi.fn() } }));
vi.mock("@/lib/razorpay", () => ({
  fetchRazorpayPayment: vi.fn(), verifyPaymentSignature: vi.fn(),
  createRazorpayOrder: vi.fn(), getRazorpay: vi.fn(), getRazorpayKeyId: vi.fn(),
}));

const input = { razorpayOrderId: "order_wheel", razorpayPaymentId: "pay_wheel", razorpaySignature: "signature" };
const captured = { id: "pay_wheel", order_id: "order_wheel", amount: 2900, currency: "INR", status: "captured", amount_refunded: 0 };

describe("Garba payment trust boundary", () => {
  beforeEach(() => {
    vi.mocked(GarbaSpin.findOne).mockResolvedValue({ status: "PENDING" } as never);
    vi.mocked(verifyPaymentSignature).mockReturnValue(true);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

  it("rejects new paid spins when the launch flag is off", async () => {
    vi.stubEnv("GARBA_PAID_SPINS_ENABLED", "false");
    await expect(createGarbaPayment("user")).rejects.toMatchObject({ status: 403 });
    expect(GarbaSpin.findOne).not.toHaveBeenCalled();
  });
  it("checks order ownership before looking up a payment", async () => {
    vi.mocked(GarbaSpin.findOne).mockResolvedValue(null);
    await expect(verifyGarbaPayment("other-user", input)).rejects.toMatchObject({ status: 404 });
    expect(fetchRazorpayPayment).not.toHaveBeenCalled();
  });
  it("rejects an invalid signature before reward issuance", async () => {
    vi.mocked(verifyPaymentSignature).mockReturnValue(false);
    await expect(verifyGarbaPayment("user", input)).rejects.toMatchObject({ status: 402 });
    expect(Coupon.create).not.toHaveBeenCalled();
    expect(fetchRazorpayPayment).not.toHaveBeenCalled();
  });
  it.each([
    { ...captured, amount: 29 },
    { ...captured, currency: "USD" },
    { ...captured, order_id: "other-order" },
    { ...captured, status: "authorized" },
    { ...captured, amount_refunded: 2900 },
  ])("rejects an incorrect or unsettled provider payment %#", async payment => {
    vi.mocked(fetchRazorpayPayment).mockResolvedValue(payment as never);
    await expect(verifyGarbaPayment("user", input)).rejects.toMatchObject({ status: 402 });
    expect(Coupon.create).not.toHaveBeenCalled();
  });
  it("returns the same stored reward on repeated verification without issuing another coupon", async () => {
    vi.mocked(fetchRazorpayPayment).mockResolvedValue(captured as never);
    const paid = { status: "PAID", offerIndex: 3, rewardCode: "GGEXISTING", rewardExpiresAt: new Date("2026-11-01T00:00:00Z") };
    vi.mocked(GarbaSpin.findOne).mockReturnValue({ then: (resolve: (value: unknown) => void) => resolve(paid), session: async () => paid } as never);
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => callback(), endSession: vi.fn(),
    } as never);
    const first = await verifyGarbaPayment("user", input);
    const second = await verifyGarbaPayment("user", input);
    expect(first).toEqual(second);
    expect(first.code).toBe("GGEXISTING");
    expect(Coupon.create).not.toHaveBeenCalled();
  });
  it("recovers a saved paid reward when the customer returns to the page", async () => {
    vi.mocked(GarbaSpin.findOne).mockReturnValue({ lean: async () => ({
      status: "PAID", offerIndex: 6, rewardCode: "GGEXISTING", rewardExpiresAt: new Date("2026-11-01T00:00:00Z"), gift: { name: "Mystery earrings", slug: "mystery-earrings" },
    }) } as never);
    expect(await getGarbaStatus("user")).toMatchObject({ reward: { offerIndex: 6, code: "GGEXISTING", gift: { slug: "mystery-earrings" } }, refunded: false });
  });
});
