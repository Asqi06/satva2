import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { User, type IAddress } from "@/models/User";
import type { AddressInput } from "@/schemas/checkout";

export interface AddressDTO extends AddressInput {
  id: string;
}

const MAX_ADDRESSES = 10;

async function userIdOrThrow(rawId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(rawId)) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return new Types.ObjectId(rawId);
}

function toDTO(subdoc: IAddress): AddressDTO {
  return {
    id: subdoc._id.toString(),
    label: subdoc.label,
    fullName: subdoc.fullName,
    phone: subdoc.phone,
    addressLine1: subdoc.addressLine1,
    addressLine2: subdoc.addressLine2,
    city: subdoc.city,
    state: subdoc.state,
    pincode: subdoc.pincode,
    landmark: subdoc.landmark,
    isDefault: subdoc.isDefault,
  };
}

export async function listAddresses(rawUserId: string): Promise<AddressDTO[]> {
  await connectDb();
  const user = await User.findById(await userIdOrThrow(rawUserId))
    .select("addresses")
    .lean();
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return (user.addresses ?? []).map(toDTO);
}

export async function addAddress(rawUserId: string, input: AddressInput): Promise<AddressDTO> {
  await connectDb();
  const user = await User.findById(await userIdOrThrow(rawUserId));
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  if (user.addresses.length >= MAX_ADDRESSES) {
    throw new AppError("CONFLICT", `Maximum ${MAX_ADDRESSES} addresses allowed`, 409);
  }
  const makeDefault = input.isDefault || user.addresses.length === 0;
  if (makeDefault) {
    for (const a of user.addresses) a.isDefault = false;
  }
  user.addresses.push({ ...input, isDefault: makeDefault } as IAddress);
  await user.save();
  const created = user.addresses[user.addresses.length - 1];
  if (!created) throw new AppError("NOT_FOUND", "Address not found", 404);
  return toDTO(created);
}

export async function updateAddress(
  rawUserId: string,
  addressId: string,
  input: Partial<AddressInput>,
): Promise<AddressDTO> {
  await connectDb();
  const user = await User.findById(await userIdOrThrow(rawUserId));
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  const subdoc = user.addresses.find((a) => a._id.toString() === addressId);
  if (!subdoc) throw new AppError("NOT_FOUND", "Address not found", 404);
  if (input.isDefault) {
    for (const a of user.addresses) a.isDefault = false;
  }
  Object.assign(subdoc, input);
  await user.save();
  return toDTO(subdoc);
}

export async function deleteAddress(rawUserId: string, addressId: string): Promise<void> {
  await connectDb();
  const user = await User.findById(await userIdOrThrow(rawUserId));
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  const subdoc = user.addresses.find((a) => a._id.toString() === addressId);
  if (!subdoc) throw new AppError("NOT_FOUND", "Address not found", 404);
  const wasDefault = subdoc.isDefault;
  const idx = user.addresses.findIndex((a) => a._id.toString() === addressId);
  user.addresses.splice(idx, 1);
  if (wasDefault && user.addresses.length > 0 && user.addresses[0]) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
}
