import { connectDb } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";
import type { ContactInput, NewsletterInput } from "@/schemas/content";

/**
 * Newsletter + contact inbox. Both idempotent and abuse-tolerant;
 * rate limiting + honeypot live in the routes.
 */

export async function subscribeNewsletter(input: NewsletterInput): Promise<{ subscribed: boolean; duplicate: boolean }> {
  await connectDb();
  const email = input.email.trim().toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email }).select("_id unsubscribed").lean();
  if (existing) {
    if (existing.unsubscribed) {
      await NewsletterSubscriber.updateOne({ _id: existing._id }, { $set: { unsubscribed: false, name: input.name } });
    }
    return { subscribed: true, duplicate: true };
  }
  try {
    await NewsletterSubscriber.create({ email, name: input.name, source: "homepage" });
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000) {
      return { subscribed: true, duplicate: true };
    }
    throw error;
  }
  return { subscribed: true, duplicate: false };
}

export async function saveContactMessage(input: ContactInput): Promise<{ id: string | null; spam: boolean }> {
  await connectDb();
  if ((input.company ?? "").trim() !== "") {
    // Honeypot filled: pretend success, store nothing.
    return { id: null, spam: true };
  }
  const created = await ContactMessage.create({
    name: input.name,
    email: input.email.trim().toLowerCase(),
    topic: input.topic,
    message: input.message,
  });
  return { id: created._id.toString(), spam: false };
}
