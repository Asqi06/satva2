import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * User model. Shares the `users` collection with the Auth.js MongoDB
 * adapter (which writes { name, email, image, emailVerified } on first
 * OAuth login). Role defaults to CUSTOMER; ADMIN is granted only via
 * the owner-run seed script (scripts/seed-admin.ts) — never via API.
 */

export type UserRole = "CUSTOMER" | "ADMIN";

export interface IAddress {
  _id: Types.ObjectId;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  phone?: string;
  role: UserRole;
  addresses: IAddress[];
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, maxlength: 32 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => INDIAN_MOBILE_REGEX.test(v),
        message: "Phone must be a 10-digit Indian mobile number",
      },
    },
    addressLine1: { type: String, required: true, trim: true, maxlength: 256 },
    addressLine2: { type: String, trim: true, maxlength: 256 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    state: { type: String, required: true, trim: true, maxlength: 120 },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => INDIAN_PINCODE_REGEX.test(v),
        message: "Pincode must be a 6-digit Indian pincode",
      },
    },
    landmark: { type: String, trim: true, maxlength: 256 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    image: { type: String, maxlength: 2048 },
    phone: {
      type: String,
      validate: {
        validator: (v: string) => v === "" || INDIAN_MOBILE_REGEX.test(v),
        message: "Phone must be a 10-digit Indian mobile number",
      },
    },
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" },
    addresses: { type: [addressSchema], default: [] },
    emailVerified: { type: Date },
  },
  { timestamps: true, collection: "users" },
);

// Note: `unique: true` on `email` above creates the unique index.
// Do NOT add a second schema.index({ email: 1 }) — Mongoose warns on duplicates.

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", userSchema);
