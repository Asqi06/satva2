import { MongoClient } from "mongodb";
import { requireServerVar } from "../src/lib/env";

const client = new MongoClient(requireServerVar("MONGODB_URI"), { serverSelectionTimeoutMS: 10000 });

async function main() {
  await client.connect();
  const carts = client.db().collection("carts");
  const legacy = (await carts.listIndexes().toArray()).find((index) => index.name === "email_1");
  if (legacy && (Object.keys(legacy.key).length !== 1 || legacy.key.email !== 1 || !legacy.unique)) {
    throw new Error("Unexpected email_1 definition; no indexes changed.");
  }
  if (!process.argv.includes("--apply")) {
    console.log(`Dry run: ensure unique userId_1 for ObjectId owners${legacy ? "; remove obsolete email_1" : ""}. No data or indexes changed.`);
    return;
  }
  // Build the replacement first: duplicate owners must fail before removing the old constraint.
  await carts.createIndex({ userId: 1 }, {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } },
  });
  if (legacy) await carts.dropIndex("email_1");
  console.log("Cart owner uniqueness repaired. Existing cart documents and items were not modified.");
}

main().catch((error: unknown) => {
  // Database errors may contain customer values; report only the failure type and code.
  console.error("Cart index repair failed", error instanceof Error ? error.name : "Error",
    typeof error === "object" && error !== null && "code" in error ? error.code : "");
  process.exitCode = 1;
}).finally(() => client.close());
