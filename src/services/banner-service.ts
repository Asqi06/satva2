import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Banner, type IBanner } from "@/models/Banner";
import type { BannerInput } from "@/schemas/content";

export interface BannerDTO {
  id: string;
  title: string;
  subtitle?: string;
  image: { publicId: string; secureUrl: string; alt: string };
  link: string;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

type LeanBanner = Omit<IBanner, "_id" | "startsAt" | "endsAt" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(doc: LeanBanner): BannerDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    subtitle: doc.subtitle,
    image: { publicId: doc.image.publicId, secureUrl: doc.image.secureUrl, alt: doc.image.alt },
    link: doc.link,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    startsAt: doc.startsAt?.toISOString(),
    endsAt: doc.endsAt?.toISOString(),
  };
}

function liveFilter(now: Date): Record<string, unknown> {
  return {
    placement: "hero",
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
    ],
  };
}

/** Active hero banners for the homepage, newest first. */
export async function listLiveBanners(): Promise<BannerDTO[]> {
  await connectDb();
  const docs = await Banner.find(liveFilter(new Date()))
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(5)
    .lean<LeanBanner[]>();
  return docs.map(toDTO);
}

export async function listAdminBanners(): Promise<BannerDTO[]> {
  await connectDb();
  const docs = await Banner.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean<LeanBanner[]>();
  return docs.map(toDTO);
}

export async function createBanner(input: BannerInput): Promise<BannerDTO> {
  await connectDb();
  const created = await Banner.create({
    ...input,
    placement: "hero",
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
  });
  const doc = await Banner.findById(created._id).lean<LeanBanner | null>();
  if (!doc) throw new AppError("NOT_FOUND", "Banner not found", 404);
  return toDTO(doc);
}

export async function updateBanner(id: string, input: Partial<BannerInput>): Promise<BannerDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new AppError("NOT_FOUND", "Banner not found", 404);
  const doc = await Banner.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Banner not found", 404);
  if (input.title !== undefined) doc.title = input.title;
  if (input.subtitle !== undefined) doc.subtitle = input.subtitle;
  if (input.image !== undefined) doc.image = input.image;
  if (input.link !== undefined) doc.link = input.link;
  if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  if (input.startsAt !== undefined) doc.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) doc.endsAt = new Date(input.endsAt);
  await doc.save();
  const fresh = await Banner.findById(id).lean<LeanBanner | null>();
  if (!fresh) throw new AppError("NOT_FOUND", "Banner not found", 404);
  return toDTO(fresh);
}

export async function deleteBanner(id: string): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new AppError("NOT_FOUND", "Banner not found", 404);
  const result = await Banner.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new AppError("NOT_FOUND", "Banner not found", 404);
}
