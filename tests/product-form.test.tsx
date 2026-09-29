/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProductForm, type ProductFormInitial } from "@/features/admin/ProductForm";
import { GARBA_OFFERS } from "@/lib/garba-offers";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({ default: () => null }));

const categories = [{ id: "64f000000000000000000001", name: "Rings", slug: "rings" }];
const initial: ProductFormInitial = {
  name: "First ring", slug: "first-ring", description: "A silver ring",
  categoryId: categories[0].id,
  images: [{ publicId: "ring", secureUrl: "https://res.cloudinary.com/demo/image/upload/ring.jpg", alt: "Ring", isThumbnail: true }],
  videos: [], price: 500, sku: "RING-1", variants: [], tagsText: "",
  stock: 10, lowStockThreshold: 5, isPublished: true, isFeatured: false,
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("saves selected Garba offers while preserving search tags and removing unticked offers", async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  render(<ProductForm mode="edit" productId="first" categories={categories}
    initial={{ ...initial, tagsText: "silver, garba-4-for-399, jhumka" }} />);
  expect(screen.getByRole("checkbox", { name: GARBA_OFFERS[0].name })).toBeChecked();
  for (const offer of GARBA_OFFERS.slice(1)) fireEvent.click(screen.getByRole("checkbox", { name: offer.name }));
  fireEvent.click(screen.getByRole("checkbox", { name: GARBA_OFFERS[0].name }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const [, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(options.body as string).tags).toEqual(["silver", "jhumka", ...GARBA_OFFERS.slice(1).map(offer => offer.tag)]);
});

it("loads each product's offer selections and keeps free gifts separate from paid offers", async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<ProductForm mode="edit" productId="first" categories={categories}
    initial={{ ...initial, price: 149, tagsText: "silver, garba-half-price" }} />);
  expect(screen.getByRole("status")).toHaveTextContent("not eligible until the product price is at least ₹299");
  expect(screen.getByRole("checkbox", { name: "Use as a free reward gift" })).toBeDisabled();
  view.rerender(<ProductForm mode="edit" productId="second" categories={categories}
    initial={{ ...initial, name: "Gift ring", tagsText: "gift, garba-gift" }} />);
  await waitFor(() => expect(screen.getByRole("checkbox", { name: "Use as a free reward gift" })).toBeChecked());
  for (const offer of GARBA_OFFERS) {
    expect(screen.getByRole("checkbox", { name: offer.name })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: offer.name })).toBeDisabled();
  }
  fireEvent.click(screen.getByRole("checkbox", { name: "Use as a free reward gift" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Use as a free reward gift" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("/api/admin/products/second");
  expect(JSON.parse(options.body as string).tags).toEqual(["gift", "garba-gift"]);
});

it("explains nested image validation failures instead of silently blocking save", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<ProductForm mode="edit" productId="first" categories={categories}
    initial={{ ...initial, images: [{ ...initial.images[0], publicId: "" }] }} />);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/images.*public id/i));
  expect(fetcher).not.toHaveBeenCalled();
});

it("saves each product's own values when another product is opened after a save", async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<ProductForm mode="edit" productId="first" categories={categories} initial={initial} />);
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Edited first ring" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));

  view.rerender(<ProductForm mode="edit" productId="second" categories={categories}
    initial={{ ...initial, name: "Second ring", slug: "second-ring", sku: "RING-2" }} />);
  await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue("Second ring"));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Edited second ring" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  const [url, options] = fetcher.mock.calls[1] as unknown as [string, RequestInit];
  expect(url).toBe("/api/admin/products/second");
  expect(JSON.parse(options.body as string)).toMatchObject({ name: "Edited second ring", sku: "RING-2", slug: "second-ring" });
});

it("allows the optional slug to be blank and uses schema validation for numeric errors", async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  render(<ProductForm mode="edit" productId="first" categories={categories} initial={initial} />);
  fireEvent.change(screen.getByLabelText(/Slug/), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Low-stock threshold"), { target: { value: "-1" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/low stock threshold/i));
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Low-stock threshold"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const [, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(options.body as string)).not.toHaveProperty("slug");
});

it("shows cross-field validation errors and lets the admin correct and save", async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  render(<ProductForm mode="edit" productId="first" categories={categories}
    initial={{ ...initial, compareAtPrice: 400 }} />);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Compare-at price must be higher than price"));
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Compare-at price/), { target: { value: "600" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
});

it("shows API failures and enables a retry after a failed save", async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: { code: "CONFLICT", message: "Product slug already in use" } }), { status: 409 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
  vi.stubGlobal("fetch", fetcher);
  render(<ProductForm mode="edit" productId="first" categories={categories} initial={initial} />);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Product slug already in use"));
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  fireEvent.change(screen.getByLabelText(/Slug/), { target: { value: "available-slug" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
