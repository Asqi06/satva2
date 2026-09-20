import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";
import { ContactMessage } from "@/models/ContactMessage";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";
import { saveContactMessage, subscribeNewsletter } from "@/services/content-service";

describe("rate limiting", () => {
  it("allows N hits then blocks until the window passes", () => {
    resetRateLimits();
    expect(rateLimit("k", 2, 60_000)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit("k", 2, 60_000)).toMatchObject({ ok: true, remaining: 0 });
    expect(rateLimit("k", 2, 60_000)).toMatchObject({ ok: false, remaining: 0 });
  });
});

describe("newsletter + contact", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await NewsletterSubscriber.syncIndexes();
    await ContactMessage.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await NewsletterSubscriber.deleteMany({});
    await ContactMessage.deleteMany({});
  });

  it("subscribes idempotently and resubscribes the unsubscribed", async () => {
    expect(await subscribeNewsletter({ email: "a@x.co", name: "A" })).toEqual({
      subscribed: true,
      duplicate: false,
    });
    expect(await subscribeNewsletter({ email: "A@x.co" })).toEqual({
      subscribed: true,
      duplicate: true,
    });
    await NewsletterSubscriber.updateOne({ email: "a@x.co" }, { $set: { unsubscribed: true } });
    expect(await subscribeNewsletter({ email: "a@x.co" })).toEqual({
      subscribed: true,
      duplicate: true,
    });
    const row = await NewsletterSubscriber.findOne({ email: "a@x.co" }).lean();
    expect(row?.unsubscribed).toBe(false);
  });

  it("stores contact messages and drops honeypot spam silently", async () => {
    const saved = await saveContactMessage({
      name: "Needy",
      email: "n@x.co",
      message: "Where is my order, please?",
    });
    expect(saved.spam).toBe(false);
    expect(saved.id).toBeTruthy();
    const spam = await saveContactMessage({
      name: "Bot",
      email: "b@x.co",
      message: "Buy cheap watches",
      company: "SEO Inc",
    });
    expect(spam).toEqual({ id: null, spam: true });
    expect(await ContactMessage.countDocuments({})).toBe(1);
  });
});
