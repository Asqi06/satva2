import mongoose, { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { User } from "@/models/User";
import { slugify } from "@/utils/slug";

interface CategoryDefinition {
  name: string;
  slug: string;
  description: string;
  aliases: string[];
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    name: "Earrings",
    slug: "earrings",
    description: "All types of earrings including jhumkas, hoops, and studs",
    aliases: ["earrings", "earring"],
  },
  {
    name: "Necklaces",
    slug: "necklaces",
    description: "Pendants, chains, and necklace sets",
    aliases: ["necklaces", "necklace", "pendant"],
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    description: "Bangles, cuffs, and delicate chain bracelets",
    aliases: ["bracelets", "bracelet"],
  },
  {
    name: "Rings",
    slug: "rings",
    description: "Statement and everyday stackable rings",
    aliases: ["rings", "ring"],
  },
  {
    name: "Gift Hampers",
    slug: "gift-hampers",
    description: "Curated celebration and gift hampers",
    aliases: ["hampers", "hamper", "mother's day"],
  },
  {
    name: "Name Necklaces",
    slug: "name-necklaces",
    description: "Customized and personalized name necklaces",
    aliases: ["name necklace", "name necklaces"],
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Hair accessories, claw clips, and style accents",
    aliases: ["accessories", "accessory"],
  },
  {
    name: "Korean Jewellery",
    slug: "korean-jewellery",
    description: "Minimalist Korean-style aesthetic jewellery",
    aliases: ["korean", "korean jewellery"],
  },
  {
    name: "Western Jewellery",
    slug: "western-jewellery",
    description: "Contemporary Western and Pinterest-inspired designs",
    aliases: ["western", "western jewellery"],
  },
  {
    name: "Traditional Jewellery",
    slug: "traditional-jewellery",
    description: "Classic Indian and oxidised ethnic jewellery",
    aliases: ["traditional", "traditional jewellery", "oxidised"],
  },
  {
    name: "Fusion Jewellery",
    slug: "fusion-jewellery",
    description: "East meets West fusion jewellery",
    aliases: ["fusion", "fusion jewellery"],
  },
];

async function runMigration(): Promise<void> {
  await connectDb();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection failed: db instance unavailable");
  }

  console.log("=== STEP 1: PROMOTING ADMIN USERS ===");
  // 1. Promote admin accounts to uppercase ADMIN
  const emailsToPromote = ["techmax1245@gmail.com", "admin@satvastones.in", "admin@satvastones.com"];
  for (const email of emailsToPromote) {
    const updated = await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { role: "ADMIN" } },
    );
    if (updated.matchedCount > 0) {
      console.log(`Promoted user ${email} to role: ADMIN`);
    } else {
      console.log(`User ${email} not found in users collection (will be granted ADMIN on login if created)`);
    }
  }

  // Also normalize any lowercase "admin" in users collection to "ADMIN"
  const adminFix = await User.updateMany(
    { role: { $regex: /^admin$/i } },
    { $set: { role: "ADMIN" } },
  );
  console.log(`Normalized ${adminFix.modifiedCount} admin roles to uppercase ADMIN`);

  // Normalize any lowercase "user" to "CUSTOMER"
  const userFix = await User.updateMany(
    { role: { $regex: /^user$/i } },
    { $set: { role: "CUSTOMER" } },
  );
  console.log(`Normalized ${userFix.modifiedCount} user roles to CUSTOMER`);

  console.log("\n=== STEP 2: CREATING & SYNCING CATEGORIES ===");
  const categoryMap = new Map<string, Types.ObjectId>();

  for (const def of CATEGORY_DEFINITIONS) {
    let cat = await Category.findOne({ slug: def.slug });
    if (!cat) {
      cat = await Category.create({
        name: def.name,
        slug: def.slug,
        description: def.description,
        isPublished: true,
        sortOrder: 0,
      });
      console.log(`Created category: ${cat.name} (${cat.slug}) -> ID: ${cat._id.toString()}`);
    } else {
      console.log(`Category exists: ${cat.name} (${cat.slug}) -> ID: ${cat._id.toString()}`);
    }

    // Map the slug and all aliases to this category ID
    categoryMap.set(def.slug.toLowerCase(), cat._id);
    categoryMap.set(def.name.toLowerCase(), cat._id);
    for (const alias of def.aliases) {
      categoryMap.set(alias.toLowerCase(), cat._id);
    }
  }

  // Fallback category
  const fallbackCat = await Category.findOne({ slug: "accessories" }) ?? await Category.findOne({});
  if (!fallbackCat) {
    throw new Error("No category found for fallback!");
  }

  console.log("\n=== STEP 3: MIGRATING PRODUCTS COLLECTION ===");
  const productsColl = db.collection("products");
  const rawProducts = await productsColl.find().toArray();
  console.log(`Found ${rawProducts.length} products to verify/migrate.`);

  let updatedCount = 0;
  for (const raw of rawProducts) {
    const rawCategory = typeof raw.category === "string" ? raw.category.trim().toLowerCase() : "";
    let matchedCatId = categoryMap.get(rawCategory);

    // If still unmatched, try matching substrings or fallback
    if (!matchedCatId) {
      for (const [key, id] of categoryMap.entries()) {
        if (rawCategory.includes(key) || key.includes(rawCategory)) {
          matchedCatId = id;
          break;
        }
      }
    }
    if (!matchedCatId) {
      matchedCatId = fallbackCat._id;
    }

    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : (typeof raw.title === "string" ? raw.title.trim() : "Product");
    const slug = typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : slugify(name);
    const sku = typeof raw.sku === "string" && raw.sku.trim() ? raw.sku.trim().toUpperCase() : `SATVA-${raw._id.toString().slice(-6).toUpperCase()}`;

    // Images normalization
    let images: { publicId: string; secureUrl: string; alt: string; isThumbnail: boolean }[] = [];
    if (Array.isArray(raw.images) && raw.images.length > 0) {
      images = raw.images.map((img: unknown, idx: number) => {
        if (typeof img === "string") {
          return { publicId: "", secureUrl: img, alt: name, isThumbnail: idx === 0 };
        }
        if (img && typeof img === "object") {
          const o = img as Record<string, unknown>;
          return {
            publicId: typeof o.publicId === "string" ? o.publicId : "",
            secureUrl: typeof o.secureUrl === "string" ? o.secureUrl : (typeof o.url === "string" ? o.url : ""),
            alt: typeof o.alt === "string" ? o.alt : name,
            isThumbnail: typeof o.isThumbnail === "boolean" ? o.isThumbnail : idx === 0,
          };
        }
        return { publicId: "", secureUrl: "", alt: name, isThumbnail: idx === 0 };
      }).filter((img) => Boolean(img.secureUrl));
    } else if (typeof raw.image === "string" && raw.image.trim()) {
      images = [{ publicId: "", secureUrl: raw.image.trim(), alt: name, isThumbnail: true }];
    }

    const price = typeof raw.price === "number" ? raw.price : 0;
    const compareAtPrice = typeof raw.compareAtPrice === "number" ? raw.compareAtPrice : (typeof raw.oldPrice === "number" ? raw.oldPrice : undefined);
    const stock = typeof raw.stock === "number" ? raw.stock : (typeof raw.stockQuantity === "number" ? raw.stockQuantity : 10);

    const now = new Date();
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : now;
    const updatedAt = raw.updatedAt ? new Date(raw.updatedAt) : now;

    await productsColl.updateOne(
      { _id: raw._id },
      {
        $set: {
          name,
          slug,
          sku,
          categoryId: matchedCatId,
          price,
          ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
          stock,
          reservedStock: typeof raw.reservedStock === "number" ? raw.reservedStock : 0,
          soldQuantity: typeof raw.soldQuantity === "number" ? raw.soldQuantity : 0,
          lowStockThreshold: typeof raw.lowStockThreshold === "number" ? raw.lowStockThreshold : 5,
          images,
          isPublished: true,
          isFeatured: Boolean(raw.isFeatured),
          ratingAverage: typeof raw.rating === "number" ? raw.rating : (typeof raw.ratingAverage === "number" ? raw.ratingAverage : 5),
          ratingCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : (typeof raw.ratingCount === "number" ? raw.ratingCount : 1),
          tags: Array.isArray(raw.tags) ? raw.tags : (Array.isArray(raw.focusKeywords) ? raw.focusKeywords : []),
          createdAt: isNaN(createdAt.getTime()) ? now : createdAt,
          updatedAt: isNaN(updatedAt.getTime()) ? now : updatedAt,
        },
      },
    );
    updatedCount++;
  }

  console.log(`Successfully migrated ${updatedCount} products with linked categoryId and normalized schema.`);

  console.log("\n=== MIGRATION COMPLETE ===");
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
