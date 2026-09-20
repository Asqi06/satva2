/**
 * One-time owner bootstrap: grant ADMIN to an existing Google user.
 *
 * Usage:
 *   ADMIN_SEED_EMAIL=owner@example.com npm run seed:admin
 *
 * Rules:
 * - The user must have signed in with Google at least once (row exists).
 * - Never creates users, never demotes, never touches anyone else.
 * - Unset ADMIN_SEED_EMAIL after use.
 */
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";

async function main(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error("ADMIN_SEED_EMAIL is required. Refusing to guess — set it and retry.");
    process.exit(1);
  }
  await connectDb();
  const user = await User.findOne({ email });
  if (!user) {
    console.error(
      `No user found for ${email}. Sign in with Google once first, then re-run.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  if (user.role === "ADMIN") {
    console.log(`${email} is already ADMIN. Nothing to do.`);
  } else {
    await User.updateOne({ _id: user._id }, { $set: { role: "ADMIN" } });
    console.log(`${email} promoted CUSTOMER → ADMIN.`);
  }
  console.log("Unset ADMIN_SEED_EMAIL now.");
  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
