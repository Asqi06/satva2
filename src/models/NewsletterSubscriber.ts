import mongoose, { Document, Model, Schema } from "mongoose";

/** Newsletter subscribers. Unsubscribe flips the flag (row retained for audit). */
export interface INewsletterSubscriber extends Document {
  email: string;
  name?: string;
  source: string;
  unsubscribed: boolean;
  createdAt: Date;
}

const subscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 320 },
    name: { type: String, trim: true, maxlength: 120 },
    source: { type: String, default: "homepage", maxlength: 64 },
    unsubscribed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "newslettersubscribers" },
);

export const NewsletterSubscriber: Model<INewsletterSubscriber> =
  (mongoose.models.NewsletterSubscriber as Model<INewsletterSubscriber> | undefined) ??
  mongoose.model<INewsletterSubscriber>("NewsletterSubscriber", subscriberSchema);
