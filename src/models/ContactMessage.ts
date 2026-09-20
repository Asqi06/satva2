import mongoose, { Document, Model, Schema } from "mongoose";

/** Contact-form inbox. Honeypot + rate limits guard the API (see route). */
export interface IContactMessage extends Document {
  name: string;
  email: string;
  topic?: string;
  message: string;
  createdAt: Date;
}

const contactSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 320 },
    topic: { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "contactmessages" },
);

contactSchema.index({ createdAt: -1 });

export const ContactMessage: Model<IContactMessage> =
  (mongoose.models.ContactMessage as Model<IContactMessage> | undefined) ??
  mongoose.model<IContactMessage>("ContactMessage", contactSchema);
