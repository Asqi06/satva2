"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { productBaseSchema, productInputSchema, type ProductInput } from "@/schemas/product";

/** Form shape: tags edited as comma text, image alt auto-filled from name. */
const formImageSchema = z.object({
  publicId: z.string().min(1, "This image is missing its upload ID. Remove it and upload it again."),
  secureUrl: z.string().url(),
  alt: z.string().max(200).default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isThumbnail: z.boolean().default(false),
});

const formSchema = productBaseSchema
  .omit({ tags: true })
  .extend({
    slug: productBaseSchema.shape.slug.or(z.literal("")).transform((value) => value || undefined),
    images: z.array(formImageSchema).min(1, "At least one image is required").max(12),
    tagsText: z.string().default(""),
  });

export type ProductFormValues = z.output<typeof formSchema>;
type FormInput = z.input<typeof formSchema>;

export interface ProductFormInitial extends ProductFormValues {
  categoryId: string;
}

const inputCls =
  "admin-input w-full px-3 py-2.5 text-sm";
const labelCls = "flex flex-col gap-1 text-sm text-ink";
const hintCls = "text-xs text-muted";

function fieldLabel(path: string[]) {
  return path.filter((part) => part !== "root").map((part) =>
    /^\d+$/.test(part) ? String(Number(part) + 1) : part.replace(/([A-Z])/g, " $1").trim(),
  ).join(" → ");
}

function validationMessages(errors: FieldErrors<FormInput>, path: string[] = []): string[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || typeof value !== "object" || ["ref", "types"].includes(key)) return [];
    const nextPath = [...path, key];
    if (typeof value.message === "string") return [`${fieldLabel(nextPath)}: ${value.message}`];
    return validationMessages(value as FieldErrors<FormInput>, nextPath);
  });
}

function FieldError({ errors, name }: { errors: FieldErrors<FormInput>; name: string }) {
  const parts = name.split(".");
  let node: unknown = errors;
  for (const part of parts) {
    if (node !== null && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      node = undefined;
      break;
    }
  }
  const message =
    node !== null && typeof node === "object" && "message" in node
      ? String((node as { message: unknown }).message)
      : undefined;
  if (!message) return null;
  return (
    <span role="alert" className="text-xs text-clay">
      {message}
    </span>
  );
}

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: ProductFormInitial;
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    // defaultValues are cached; values follows the product opened by navigation.
    values: initial,
    defaultValues: initial ?? {
      name: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      images: [],
      videos: [],
      price: 0,
      sku: "",
      variants: [],
      tagsText: "",
      stock: 0,
      lowStockThreshold: 5,
      isPublished: false,
      isFeatured: false,
    },
  });

  const images = watch("images") ?? [];
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        if (getValues("images").length >= 12) throw new Error("A product can have up to 12 images.");
        // Client-side guard: Vercel rejects >~4.5MB bodies before our API runs.
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
          throw new Error(`${file.name}: choose a JPG, PNG, WebP or AVIF image.`);
        }
        if (file.size > 4 * 1024 * 1024) {
          throw new Error(`${file.name}: too large — use an image under 4MB (phone photos: pick "Medium" size).`);
        }
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          throw new Error(
            `${file.name}: server refused the upload (status ${res.status}) — check Cloudinary keys on Vercel and use JPG/PNG/WebP under 4MB.`,
          );
        }
        const parsed = body as
          | { success: true; data: { publicId: string; secureUrl: string; width?: number; height?: number } }
          | { success: false; error: { message: string } };
        if (!parsed.success) throw new Error(`${file.name}: ${parsed.error.message}`);
        setValue("images", [
          ...getValues("images"),
          {
            publicId: parsed.data.publicId,
            secureUrl: parsed.data.secureUrl,
            alt: "",
            width: parsed.data.width,
            height: parsed.data.height,
            isThumbnail: getValues("images").length === 0,
          },
        ]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setThumbnail = (index: number) => {
    setValue(
      "images",
      getValues("images").map((img, i) => ({ ...img, isThumbnail: i === index })),
    );
  };

  const removeImage = (index: number) => {
    const next = getValues("images").filter((_, i) => i !== index);
    const first = next[0];
    if (first && !next.some((img) => img.isThumbnail)) first.isThumbnail = true;
    setValue("images", next);
  };

  const onSubmit = async (raw: FormInput) => {
    setSaving(true);
    setServerError(null);
    try {
      const values: ProductFormValues = formSchema.parse(raw);
      const name = values.name.trim();
      const payload: ProductInput = {
        ...values,
        name,
        images: values.images.map((img) => ({ ...img, alt: img.alt.trim() || name })),
        tags: values.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      };
      // Final gate: the API schema (identical rules to the server).
      productInputSchema.parse(payload);
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as
        | { success: true }
        | { success: false; error: { code: string; message: string; details?: { path: string; message: string }[] } };
      if (!body.success) {
        const details = body.error.details?.map((d) => `${d.path}: ${d.message}`).join("; ");
        throw new Error(details ? `${body.error.message} — ${details}` : body.error.message);
      }
      router.push("/admin/products");
    } catch (error) {
      setServerError(error instanceof z.ZodError
        ? `Please fix the following before saving: ${error.issues.map((issue) => `${fieldLabel(issue.path.map(String))}: ${issue.message}`).join("; ")}`
        : error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit, (invalid) => {
      setServerError(`Please fix the following before saving: ${validationMessages(invalid).join("; ")}`);
    })} className="space-y-6">
      <div className="sticky top-[72px] z-20 flex flex-wrap items-center justify-between gap-3 border-b border-light-gray bg-[#f5f6f7] py-3">
        <div><Link href="/admin/products" className="mb-2 inline-block text-xs text-muted underline underline-offset-4">All products</Link><h1 className="admin-title">
          {mode === "create" ? "New product" : "Edit product"}
        </h1></div>
        <button
          type="submit"
          disabled={saving || uploading}
          className="btn-primary"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        {serverError && (
          <p role="alert" className="w-full border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </p>
        )}
      </div>

      <fieldset disabled={saving} aria-label="Basics" className="admin-card p-5">
        <h2 className="text-base font-semibold text-ink">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            Name
            <input {...register("name")} className={inputCls} />
            <FieldError errors={errors} name="name" />
          </label>
          <label className={labelCls}>
            Slug (optional — auto from name)
            <input {...register("slug")} placeholder="ivory-ember-bracelet" className={inputCls} />
            <FieldError errors={errors} name="slug" />
          </label>
          <label className={labelCls}>
            Category
            <select {...register("categoryId")} className={inputCls}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError errors={errors} name="categoryId" />
          </label>
          <label className={labelCls}>
            Subcategory (optional)
            <input {...register("subcategory")} className={inputCls} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Short description
            <input {...register("shortDescription")} maxLength={280} className={inputCls} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Description
            <textarea {...register("description")} rows={5} className={inputCls} />
            <span className={hintCls}>Describe this piece in your own words: style, material, size or fit, care, and when someone would wear or gift it. Use a Hindi/Hinglish name only when it matches the item.</span>
            <FieldError errors={errors} name="description" />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Tags (comma separated)
            <input {...register("tagsText")} placeholder="korean, minimal, gift" className={inputCls} />
            <span className={hintCls}>Add accurate search synonyms such as jhumka, bali, anguthi, haar or kangan for relevant products.</span>
          </label>
        </div>
      </fieldset>

      <fieldset disabled={saving} aria-label="Price and inventory" className="admin-card p-5">
        <h2 className="text-base font-semibold text-ink">Price &amp; inventory (₹, whole rupees)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className={labelCls}>
            Price
            <input type="number" min={0} step={1} {...register("price", { valueAsNumber: true })} className={inputCls} />
            <FieldError errors={errors} name="price" />
          </label>
          <label className={labelCls}>
            Compare-at price (optional)
            <input
              type="number"
              min={0}
              step={1}
              {...register("compareAtPrice", { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) })}
              className={inputCls}
            />
            <FieldError errors={errors} name="compareAtPrice" />
          </label>
          <label className={labelCls}>
            SKU
            <input {...register("sku")} className={`${inputCls} font-mono`} />
            <FieldError errors={errors} name="sku" />
          </label>
          <label className={labelCls}>
            Stock
            <input type="number" min={0} step={1} {...register("stock", { valueAsNumber: true })} className={inputCls} />
            <FieldError errors={errors} name="stock" />
          </label>
          <label className={labelCls}>
            Low-stock threshold
            <input type="number" min={0} step={1} {...register("lowStockThreshold", { valueAsNumber: true })} className={inputCls} />
          </label>
          <div className="flex items-end gap-6 pb-2 text-sm text-muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isPublished")} className="h-4 w-4 accent-primary" />
              Published
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 accent-primary" />
              Featured
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset disabled={saving} aria-label="Images" className="admin-card p-5">
        <h2 className="text-base font-semibold text-ink">Images</h2>
        <p className={hintCls}>The first upload becomes the thumbnail; you can change it below. Empty alt text falls back to the product name.</p>
        <label className="mt-3 block border border-dashed border-light-gray p-6 text-center text-sm text-muted hover:border-primary/50 hover:text-muted">
          {uploading ? "Uploading…" : "Choose product images (JPG/PNG/WebP/AVIF ≤ 4MB)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={(e) => void uploadFiles(e.target.files)}
            className="sr-only"
          />
        </label>
        {uploadError && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {uploadError}
          </p>
        )}
        <FieldError errors={errors} name="images" />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {images.map((img, i) => (
            <li key={img.publicId} className="flex gap-3 border border-light-gray p-3">
              <span className="relative block h-20 w-16 shrink-0 overflow-hidden bg-white">
                <Image src={img.secureUrl} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <div className="flex w-full flex-col gap-2">
                <input
                  aria-label={`Alt text for image ${i + 1}`}
                  placeholder="Alt text"
                  {...register(`images.${i}.alt`)}
                  className="admin-input w-full px-2 py-1 text-xs"
                />
                <span className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setThumbnail(i)}
                    aria-pressed={img.isThumbnail}
                    className={img.isThumbnail ? "font-semibold text-primary" : "text-muted underline underline-offset-2 hover:text-ink"}
                  >
                    {img.isThumbnail ? "Thumbnail" : "Make thumbnail"}
                  </button>
                  <button type="button" onClick={() => removeImage(i)} className="text-muted underline underline-offset-2 hover:text-red-700">
                    Remove
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset disabled={saving} aria-label="Variants" className="admin-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Variants</h2>
          <button
            type="button"
            onClick={() => appendVariant({ sku: "", stock: 0 })}
            className="border border-light-gray px-4 py-1.5 text-sm text-muted hover:border-primary hover:text-primary"
          >
            + Add variant
          </button>
        </div>
        <FieldError errors={errors} name="variants" />
        {variantFields.map((field, i) => (
          <fieldset key={field.id} className="mt-3 grid gap-3 border border-light-gray p-3 sm:grid-cols-2 xl:grid-cols-6">
            <legend className="sr-only">Variant {i + 1}</legend>
            <label className={`${labelCls} sm:col-span-2`}>
              SKU
              <input {...register(`variants.${i}.sku`)} className={`${inputCls} font-mono`} />
            </label>
            <label className={labelCls}>
              Size
              <input {...register(`variants.${i}.size`)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Colour
              <input {...register(`variants.${i}.color`)} className={inputCls} />
            </label>
            <label className={labelCls}>
              Price (₹, optional)
              <input
                type="number"
                min={0}
                {...register(`variants.${i}.price`, { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) })}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              Stock
              <input type="number" min={0} {...register(`variants.${i}.stock`, { valueAsNumber: true })} className={inputCls} />
            </label>
            <span className="sm:col-span-2 xl:col-span-6">
              <button type="button" onClick={() => removeVariant(i)} className="text-sm text-muted underline underline-offset-4 hover:text-red-700">
                Remove variant
              </button>
            </span>
          </fieldset>
        ))}
      </fieldset>

      <fieldset disabled={saving} aria-label="Attributes" className="admin-card p-5">
        <h2 className="text-base font-semibold text-ink">Attributes &amp; SEO</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["material", "Material"],
              ["color", "Colour"],
              ["size", "Size"],
              ["dimensions", "Dimensions"],
              ["weight", "Weight"],
              ["seoTitle", "SEO title"],
              ["seoDescription", "SEO description"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className={labelCls}>
              {label}
              <input {...register(name)} className={inputCls} />
            </label>
          ))}
        </div>
      </fieldset>

    </form>
  );
}
