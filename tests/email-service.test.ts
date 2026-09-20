import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import {
  notifyOrderConfirmation,
  notifyWelcome,
} from "@/lib/email";
import {
  cancellationEmail,
  deliveredEmail,
  orderConfirmationEmail,
  outForDeliveryEmail,
  paymentReceiptEmail,
  refundEmail,
  shippedEmail,
  welcomeEmail,
  type OrderEmailData,
} from "@/features/notifications/templates";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

process.env.RESEND_API_KEY = "re_test_key";

const DATA: OrderEmailData = {
  shortId: "ABC12345",
  customerName: "Test Buyer",
  items: [{ name: "Ring", variantSku: "RING-S6", qty: 2, unitPrice: 500, totalPrice: 1000 }],
  subtotal: 1000,
  discount: 100,
  shipping: 0,
  total: 900,
  couponCode: "WELCOME10",
  city: "Vapi",
  pincode: "396191",
  eta: "5–7 days",
};

describe("templates", () => {
  const all = [
    welcomeEmail("Priya"),
    orderConfirmationEmail(DATA),
    paymentReceiptEmail(DATA),
    shippedEmail(DATA),
    outForDeliveryEmail(DATA),
    deliveredEmail(DATA),
    cancellationEmail({ ...DATA, reason: "Changed mind" }),
    refundEmail(DATA),
  ];

  it("subjects name the event", () => {
    const subjects = all.map((e) => e.subject);
    expect(subjects[0]).toContain("Welcome");
    expect(subjects[1]).toContain("ABC12345");
    expect(subjects[2]).toContain("Payment received");
    expect(subjects[7]).toContain("Refund");
  });

  it("money content carries amounts and no secrets", () => {
    for (const email of all) {
      const blob = `${email.subject}\n${email.text}\n${email.html}`;
      expect(blob).not.toMatch(/rzp_|secret|password|card|cvv/i);
    }
    expect(orderConfirmationEmail(DATA).text).toContain("900");
    expect(paymentReceiptEmail(DATA).text).toContain("900");
    expect(refundEmail(DATA).text).toContain("900");
  });

  it("html is a complete shell", () => {
    for (const email of all) {
      expect(email.html).toContain("SatvaStones");
      expect(email.html.length).toBeGreaterThan(email.text.length * 0.5);
    }
  });
});

describe("delivery", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await Notification.syncIndexes();
    await User.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    sendMock.mockReset();
  });

  it("sends and logs SENT", async () => {
    sendMock.mockResolvedValue({ id: "msg_1" });
    await notifyWelcome("new@x.co", "New");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const logged = await Notification.findOne({ to: "new@x.co" }).lean();
    expect(logged).toMatchObject({ status: "SENT", type: "WELCOME" });
  });

  it("retries once then logs FAILED without throwing", async () => {
    sendMock.mockRejectedValue(new Error("network down"));
    await User.create({ email: "u@x.co", name: "U" });
    const user = await User.findOne({ email: "u@x.co" }).select("_id").lean();
    const order = {
      id: "order1",
      items: [],
      address: {
        fullName: "U",
        phone: "9876543210",
        addressLine1: "1",
        city: "Vapi",
        state: "Gujarat",
        pincode: "396191",
      },
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      timeline: [],
      createdAt: new Date().toISOString(),
    };
    await expect(
      notifyOrderConfirmation(user?._id.toString() ?? "", order),
    ).resolves.toBeUndefined();
    expect(sendMock).toHaveBeenCalledTimes(2);
    const logged = await Notification.findOne({ type: "ORDER_CONFIRMATION" }).lean();
    expect(logged).toMatchObject({ status: "FAILED" });
  });

  it("recovers on the second attempt", async () => {
    sendMock.mockRejectedValueOnce(new Error("flaky")).mockResolvedValue({ id: "msg_2" });
    await notifyWelcome("retry@x.co", "Retry");
    expect(sendMock).toHaveBeenCalledTimes(2);
    const logged = await Notification.findOne({ to: "retry@x.co" }).lean();
    expect(logged).toMatchObject({ status: "SENT" });
  });

  it("skips recipients without email", async () => {
    sendMock.mockResolvedValue({ id: "msg_3" });
    const ghost = await User.create({ email: "ghost@x.co" });
    await User.updateOne({ _id: ghost._id }, { $unset: { email: 1 } });
    const order = {
      id: "order2",
      items: [],
      address: {
        fullName: "G",
        phone: "9876543210",
        addressLine1: "1",
        city: "Vapi",
        state: "Gujarat",
        pincode: "396191",
      },
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      timeline: [],
      createdAt: new Date().toISOString(),
    };
    await notifyOrderConfirmation(ghost._id.toString(), order);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
